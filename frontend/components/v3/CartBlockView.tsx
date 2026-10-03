/**
 * CartBlockView: one block of the V3 Workout Cart, scan-first (founder UX pass).
 *
 *   MAIN LIFT                                    block label from the programming role, or the structure when it matters
 *   [thumb]  Barbell Bench Press       4 × 6–8   name, then the prescription; nothing else on the row
 *   [thumb]  Incline DB Press          3 × 8–10
 *
 *   SUPERSET · 3 ROUNDS
 *   A1 [thumb]  Lateral Raise          12–15     grouped work keeps its markers and a rail
 *   A2 [thumb]  Cable Triceps Extension 10–12
 *
 *   Athletic rows may carry a short context tag under the prescription (FOR VELOCITY / PRIMER / HEAVY, THEN EXPLODE).
 *
 * Rest, effort, muscles and coaching live in the session and the detail sheet (tap a row). Main work is larger and brighter
 * than secondary / support work. Swap stays one tap away (the small icon), server-validated as before.
 */
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/brand';
import type { ScanBlock } from '../../utils/v3CartFormat';
import type { V3Item } from '../../utils/v3Api';
import type { TermId } from '../../utils/v3PlainLanguage';
import { ExerciseThumb } from './ExerciseThumb';
import { Shimmer } from './Shimmer';

interface Props {
  block: ScanBlock;
  onOpen: (item: V3Item) => void;
  highlightItemId?: string | null;
  onSwap?: (item: V3Item) => void;
  swappingItemId?: string | null;
  onTerm?: (t: TermId) => void;
  /** rendered inside a CartSectionView card: no top margin, an empty label collapses, rows divide from the block above */
  inSection?: boolean;
  first?: boolean;
}

export function CartBlockView({ block, onOpen, highlightItemId, onSwap, swappingItemId, onTerm, inSection, first }: Props) {
  const main = block.emphasis === 'main';
  const labelled = !!block.label;
  return (
    <View style={[styles.block, inSection && styles.blockInSection, inSection && !first && labelled && styles.blockAfter]} testID={`v3-cart-block-${block.key}`}>
      {labelled ? (
        <Pressable disabled={!block.terms.length || !onTerm} onPress={() => onTerm?.(block.terms[0])} hitSlop={6} style={[styles.head, inSection && styles.headInSection]} testID={`v3-block-facts-${block.key}`}>
          <Text style={[styles.label, main && !inSection && styles.labelMain]}>{block.label}</Text>
          {block.terms.length && onTerm ? <Ionicons name="information-circle-outline" size={13} color="rgba(255,255,255,0.35)" /> : null}
          {block.sublabel ? <Text style={styles.sublabel}>{block.sublabel}</Text> : null}
        </Pressable>
      ) : null}

      <View style={[labelled && styles.rows, block.grouped && styles.grouped]}>
        {block.rows.map((r, i) => {
          const it = r.item;
          const divide = i > 0 || (inSection && !first && !labelled);
          return (
            <Pressable
              key={r.key}
              onPress={() => onOpen(it)}
              style={({ pressed }) => [styles.row, divide && styles.divider, highlightItemId === it.item_id && styles.highlight, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`${it.exercise.name}, ${r.rx}. Details`}
              testID={`v3-cart-item-${it.item_id}`}
            >
              {r.marker ? (
                <Text style={[styles.marker, r.marker === 'ANCHOR' && styles.markerAnchor]}>{r.marker}</Text>
              ) : null}
              <ExerciseThumb item={it} size={main ? 68 : 60} />
              <View style={styles.body}>
                <Text style={[styles.name, main && styles.nameMain]} numberOfLines={2}>
                  {it.exercise.name}
                </Text>
                <Text style={[styles.rx, main && styles.rxMain]} testID={`v3-cart-rx-${it.item_id}`}>
                  {r.rx}
                  {r.roundsNote ? <Text style={styles.roundsNote}>{`  ${r.roundsNote}`}</Text> : null}
                </Text>
                {r.context ? <Text style={styles.context} testID={`v3-cart-context-${it.item_id}`}>{r.context}</Text> : null}
              </View>
              {onSwap && it.swap?.swappable ? (
                <Pressable
                  onPress={() => onSwap(it)}
                  disabled={!!swappingItemId}
                  hitSlop={10}
                  style={({ pressed }) => [styles.swap, pressed && { opacity: 0.6 }, !!swappingItemId && swappingItemId !== it.item_id && { opacity: 0.35 }]}
                  accessibilityLabel={`Swap ${it.exercise.name}`}
                  testID={`v3-row-swap-${it.item_id}`}
                >
                  {/* a slower, fainter version of the "Different workout" shimmer, staggered down the list (founder pass, Oct 2026) */}
                  {!swappingItemId ? <Shimmer size={32} offset={((block.number * 7 + i) * 450) % 7000} pause={7000} duration={1700} strength={0.3} /> : null}
                  {swappingItemId === it.item_id ? <ActivityIndicator size="small" color={COLORS.textPrimary} /> : <Ionicons name="swap-horizontal" size={15} color="rgba(255,255,255,0.55)" />}
                </Pressable>
              ) : (
                <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.22)" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginTop: 26 },
  blockInSection: { marginTop: 0 },
  blockAfter: { marginTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.10)', paddingTop: 10 },
  headInSection: { paddingTop: 4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  label: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1.6, color: COLORS.textTertiary },
  labelMain: { color: COLORS.accent },
  sublabel: { fontSize: 11.5, fontWeight: '600', color: COLORS.textTertiary, marginLeft: 4 },
  rows: { marginTop: 6 },
  grouped: { borderLeftWidth: 2, borderLeftColor: 'rgba(255,255,255,0.14)', paddingLeft: 12, marginLeft: 2, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 9 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.07)' },
  highlight: { backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: -10, paddingHorizontal: 10, borderRadius: 14 },
  pressed: { opacity: 0.7 },
  marker: { width: 26, fontSize: 12, fontWeight: '800', color: COLORS.accent, letterSpacing: 0.4, fontVariant: ['tabular-nums'] },
  markerAnchor: { width: 26, fontSize: 9.5, letterSpacing: 0.3 },
  body: { flex: 1 },
  name: { fontSize: 15.5, fontWeight: '600', color: 'rgba(255,255,255,0.9)', letterSpacing: -0.1 },
  nameMain: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  rx: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginTop: 2, fontVariant: ['tabular-nums'] },
  rxMain: { fontSize: 15, color: 'rgba(255,255,255,0.85)' },
  roundsNote: { fontSize: 12, color: COLORS.textTertiary, fontWeight: '600' },
  context: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, color: COLORS.accent, marginTop: 3, opacity: 0.85 },
  swap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
});
