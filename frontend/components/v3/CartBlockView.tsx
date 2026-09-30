/**
 * CartBlockView: one block of the V3 Workout Cart (H2), read-first.
 *
 *   2  SECONDARY                               Direction-specific heading from the block's programming role
 *      Superset · 3 rounds · 90 s between      structure + block facts, said once
 *   A1 [thumb] Chest-Supported Row      10     identity first, then the prescription, then quiet context
 *              Back                             (rest on straight sets, one muscle)
 *
 * Rows are tappable (detail sheet: media, cues, load guidance, quality stop, Swap). No edit controls here (H4).
 */
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/brand';
import type { CartBlock } from '../../utils/v3CartFormat';
import type { V3Item } from '../../utils/v3Api';
import { ExerciseThumb } from './ExerciseThumb';

import type { TermId } from '../../utils/v3PlainLanguage';

interface Props {
  block: CartBlock;
  onOpen: (item: V3Item) => void;
  highlightItemId?: string | null;
  /** Founder edit pass: Swap right on the row (server-validated swap-exercise). */
  onSwap?: (item: V3Item) => void;
  swappingItemId?: string | null;
  /** Tap a format term (EMOM, superset) for its definition. */
  onTerm?: (t: TermId) => void;
}

export function CartBlockView({ block, onOpen, highlightItemId, onSwap, swappingItemId, onTerm }: Props) {
  return (
    <View style={styles.block} testID={`v3-cart-block-${block.key}`}>
      <View style={styles.head}>
        <Text style={styles.num}>{String(block.number).padStart(2, '0')}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>{block.heading}</Text>
          {block.subtitle ? <Text style={styles.subtitle}>{block.subtitle}</Text> : null}
          {block.facts ? (
            <Pressable disabled={!block.terms.length || !onTerm} onPress={() => onTerm?.(block.terms[0])} hitSlop={6} style={styles.factsRow} testID={`v3-block-facts-${block.key}`}>
              <Text style={styles.facts}>{block.facts}</Text>
              {block.terms.length && onTerm ? <Ionicons name="information-circle-outline" size={13} color="rgba(255,255,255,0.4)" /> : null}
            </Pressable>
          ) : null}
        </View>
      </View>
      {block.caption ? <Text style={styles.caption}>{block.caption}</Text> : null}

      <View style={[styles.rows, block.grouped && styles.grouped]}>
        {block.rows.map((r, i) => {
          const it = r.item;
          return (
            <Pressable
              key={r.key}
              onPress={() => onOpen(it)}
              style={({ pressed }) => [styles.row, i > 0 && styles.divider, highlightItemId === it.item_id && styles.highlight, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`${it.exercise.name}, ${r.rx}. Details`}
              testID={`v3-cart-item-${it.item_id}`}
            >
              <ExerciseThumb item={it} size={50} />
              <View style={styles.body}>
                <View style={styles.nameLine}>
                  {r.tag ? (
                    <View style={[styles.tag, r.tag === 'ANCHOR' && styles.tagAnchor]}>
                      <Text style={styles.tagText}>{r.tag}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.name} numberOfLines={2}>
                    {it.exercise.name}
                  </Text>
                </View>
                <Text style={styles.rx} testID={`v3-cart-rx-${it.item_id}`}>
                  {r.rx}
                </Text>
                {r.facts.length ? <Text style={styles.meta}>{r.facts.join(' · ')}</Text> : null}
                {r.scale ? (
                  <View style={styles.scaleLine} testID={`v3-cart-scale-${it.item_id}`}>
                    <Ionicons name="options-outline" size={12} color="rgba(255,255,255,0.55)" />
                    <Text style={styles.scaleText}>{r.scale}</Text>
                  </View>
                ) : null}
                {r.note ? (
                  <Text style={styles.note} numberOfLines={2}>
                    {r.note}
                  </Text>
                ) : null}
              </View>
              <View style={styles.trail}>
                {onSwap && it.swap?.swappable ? (
                  <Pressable
                    onPress={() => onSwap(it)}
                    disabled={!!swappingItemId}
                    hitSlop={8}
                    style={({ pressed }) => [styles.swap, pressed && { opacity: 0.6 }, !!swappingItemId && swappingItemId !== it.item_id && { opacity: 0.35 }]}
                    accessibilityLabel={`Swap ${it.exercise.name}`}
                    testID={`v3-row-swap-${it.item_id}`}
                  >
                    {swappingItemId === it.item_id ? (
                      <ActivityIndicator size="small" color={COLORS.textPrimary} />
                    ) : (
                      <>
                        <Ionicons name="swap-horizontal" size={13} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.swapText}>Swap</Text>
                      </>
                    )}
                  </Pressable>
                ) : (
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.28)" />
                )}
                {r.hasProgression ? <Ionicons name="trending-up" size={13} color={COLORS.accent} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginTop: 30 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  num: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.32)', marginTop: 3, fontVariant: ['tabular-nums'], letterSpacing: 0.5 },
  heading: { fontSize: 19, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 13.5, fontWeight: '600', color: COLORS.textSecondary, marginTop: 2 },
  factsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  facts: { fontSize: 12.5, color: COLORS.textTertiary },
  caption: { fontSize: 12.5, lineHeight: 18, color: COLORS.textTertiary, marginTop: 8, marginLeft: 31 },
  rows: { marginTop: 8 },
  grouped: { borderLeftWidth: 2, borderLeftColor: 'rgba(255,215,0,0.55)', paddingLeft: 12, marginLeft: 2, marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  highlight: { backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: -10, paddingHorizontal: 10, borderRadius: 14 },
  pressed: { opacity: 0.7 },
  body: { flex: 1 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)' },
  tagAnchor: { backgroundColor: 'rgba(255,255,255,0.16)' },
  tagText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5, color: COLORS.accent },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.1 },
  scaleLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  scaleText: { fontSize: 12.5, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  rx: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginTop: 3, fontVariant: ['tabular-nums'], opacity: 0.92 },
  meta: { fontSize: 12.5, color: COLORS.textTertiary, marginTop: 2 },
  note: { fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  trail: { alignItems: 'flex-end', gap: 6 },
  swap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 64,
    justifyContent: 'center',
    height: 28,
    paddingHorizontal: 9,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  swapText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
});
