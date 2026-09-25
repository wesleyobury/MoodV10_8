/**
 * ExerciseRow — one V3 item. Shared by every Direction.
 *
 * Renders prescription.display as-is. Direction-specific extras are data
 * driven: Athletic `quality_stop`, Sweat anchor-station rounds. Progression
 * and cues only render when the API returns them.
 */
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/brand';
import type { V3Block, V3Item } from '../../utils/v3Api';
import { anchorRoundsLabel, itemGuidance, itemRest, progressionText } from '../../utils/v3OverviewFormat';
import { ExerciseThumb } from './ExerciseThumb';

interface Props {
  item: V3Item;
  block: V3Block;
  /** "A1", "A2" for supersets; null otherwise. */
  tag?: string | null;
  onSwap?: (item: V3Item) => void;
  swapping?: boolean;
  swapDisabled?: boolean;
  highlight?: boolean;
}

export function ExerciseRow({ item, block, tag, onSwap, swapping, swapDisabled, highlight }: Props) {
  const [cuesOpen, setCuesOpen] = useState(false);
  const guidance = itemGuidance(item);
  const rest = itemRest(item, block);
  const rounds = anchorRoundsLabel(item, block);
  const progression = progressionText(item);
  const cues = (item.cues || []).filter((c) => c && c.trim());
  const canSwap = !!onSwap && !!item.swap?.swappable;
  const meta = [item.exercise.equipment_label, rest].filter(Boolean).join(' · ');

  return (
    <View style={[styles.row, highlight && styles.rowHighlight]} testID={`v3-item-${item.item_id}`}>
      <ExerciseThumb item={item} />
      <View style={styles.body}>
        <View style={styles.topLine}>
          <View style={styles.nameWrap}>
            {tag ? <Text style={styles.tag}>{tag}</Text> : null}
            <Text style={styles.name} numberOfLines={2}>
              {item.exercise.name}
            </Text>
          </View>
          {canSwap ? (
            <Pressable
              onPress={() => onSwap!(item)}
              disabled={swapping || swapDisabled}
              hitSlop={10}
              style={({ pressed }) => [styles.swap, pressed && { opacity: 0.6 }, (swapDisabled && !swapping) && { opacity: 0.35 }]}
              accessibilityLabel={`Swap ${item.exercise.name}`}
              testID={`v3-swap-${item.item_id}`}
            >
              {swapping ? (
                <ActivityIndicator size="small" color={COLORS.accent} />
              ) : (
                <Ionicons name="swap-horizontal" size={16} color="rgba(255,255,255,0.7)" />
              )}
            </Pressable>
          ) : null}
        </View>

        <View style={styles.rxLine}>
          <Text style={styles.rx}>{item.prescription.display}</Text>
          {rounds ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{rounds}</Text>
            </View>
          ) : null}
        </View>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        {guidance ? <Text style={styles.guidance}>{guidance}</Text> : null}

        {item.quality_stop ? (
          <View style={styles.note}>
            <Ionicons name="speedometer-outline" size={13} color={COLORS.accent} style={styles.noteIcon} />
            <Text style={styles.noteText}>{item.quality_stop}</Text>
          </View>
        ) : null}

        {progression ? (
          <View style={[styles.note, styles.progress]}>
            <Ionicons name="trending-up" size={13} color={COLORS.accent} style={styles.noteIcon} />
            <Text style={[styles.noteText, styles.progressText]}>{progression}</Text>
          </View>
        ) : null}

        {cues.length ? (
          <Pressable onPress={() => setCuesOpen((v) => !v)} hitSlop={6} testID={`v3-cues-${item.item_id}`}>
            {cuesOpen ? (
              cues.map((c, i) => (
                <Text key={i} style={styles.cue}>
                  {'•  '}
                  {c}
                </Text>
              ))
            ) : (
              <Text style={styles.cue} numberOfLines={1}>
                {'•  '}
                {cues[0]}
              </Text>
            )}
            {cues.length > 1 ? (
              <Text style={styles.more}>{cuesOpen ? 'Show less' : `+${cues.length - 1} more`}</Text>
            ) : null}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  rowHighlight: { backgroundColor: 'rgba(255,215,0,0.04)', marginHorizontal: -10, paddingHorizontal: 10, borderRadius: 12 },
  body: { flex: 1 },
  topLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  nameWrap: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  tag: { fontSize: 11, fontWeight: '800', color: COLORS.accent, letterSpacing: 0.6 },
  name: { flex: 1, fontSize: 15.5, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.1 },
  swap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: -4,
  },
  rxLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  rx: { fontSize: 15, fontWeight: '600', color: COLORS.accent, fontVariant: ['tabular-nums'] },
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.07)' },
  pillText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  meta: { fontSize: 12, color: COLORS.textTertiary, marginTop: 3 },
  guidance: { fontSize: 12.5, lineHeight: 18, color: COLORS.textSecondary, marginTop: 4 },
  note: { flexDirection: 'row', gap: 6, marginTop: 6, alignItems: 'flex-start' },
  noteIcon: { marginTop: 2 },
  noteText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: 'rgba(255,255,255,0.8)' },
  progress: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,215,0,0.35)',
  },
  progressText: { color: COLORS.textPrimary, fontWeight: '600' },
  cue: { fontSize: 12.5, lineHeight: 18, color: COLORS.textTertiary, marginTop: 6 },
  more: { fontSize: 11.5, fontWeight: '600', color: 'rgba(255,255,255,0.45)', marginTop: 3 },
});
