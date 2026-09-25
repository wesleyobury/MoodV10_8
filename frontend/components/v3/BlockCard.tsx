/**
 * BlockCard — one V3 block (Main lift, Superset, Circuit, Primary exposure…).
 * Title, instructions and structure come from the API; `blockMeta` only
 * formats the numeric fields (rounds, intervals, RPE, rest between rounds).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/brand';
import type { V3Block, V3Direction, V3Item } from '../../utils/v3Api';
import { blockMeta } from '../../utils/v3OverviewFormat';
import { ExerciseRow } from './ExerciseRow';

interface Props {
  block: V3Block;
  index: number;
  direction: V3Direction;
  onSwap?: (item: V3Item) => void;
  swappingItemId?: string | null;
  highlightItemId?: string | null;
}

const GROUPED = new Set(['superset']);

export function BlockCard({ block, index, direction, onSwap, swappingItemId, highlightItemId }: Props) {
  const meta = blockMeta(block, direction);
  const grouped = GROUPED.has(block.structure) && block.items.length > 1;
  const letter = String.fromCharCode(65 + (index % 26));
  return (
    <View style={styles.card} testID={`v3-block-${block.block_id}`}>
      <View style={styles.head}>
        <View style={styles.num}>
          <Text style={styles.numText}>{index + 1}</Text>
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>{block.title}</Text>
          {meta.length ? <Text style={styles.meta}>{meta.join('  ·  ')}</Text> : null}
        </View>
      </View>
      {block.instructions ? <Text style={styles.instructions}>{block.instructions}</Text> : null}
      <View style={[styles.items, grouped && styles.itemsGrouped]}>
        {block.items.map((it, i) => (
          <View key={it.item_id} style={i > 0 && styles.divider}>
            <ExerciseRow
              item={it}
              block={block}
              tag={grouped ? `${letter}${i + 1}` : null}
              onSwap={onSwap}
              swapping={swappingItemId === it.item_id}
              swapDisabled={!!swappingItemId && swappingItemId !== it.item_id}
              highlight={highlightItemId === it.item_id}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  num: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  numText: { fontSize: 12, fontWeight: '800', color: COLORS.textPrimary },
  headText: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.1 },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  instructions: { fontSize: 12.5, lineHeight: 18, color: COLORS.textTertiary, marginTop: 10 },
  items: { marginTop: 4 },
  itemsGrouped: { borderLeftWidth: 2, borderLeftColor: 'rgba(255,215,0,0.45)', paddingLeft: 12, marginTop: 10 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
});
