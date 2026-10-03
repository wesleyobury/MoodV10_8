/**
 * OverviewView: the low-friction training view. The whole workout as a premium interactive sheet over the same session.
 *
 *   MAIN LIFT
 *   ✓ [thumb] Barbell Bench Press        4 × 6–8      3 / 4     tap the row: make it current; tap the circle: complete a set
 *   ◔ [thumb] Incline DB Press           3 × 8–10     1 / 3     long-press the check: undo the last set
 *   SUPERSET · 3 ROUNDS
 *   A1 ○ [thumb] Lateral Raise · 12–15
 *   INTERVALS · 8 × 2 MIN / 1:30 EASY                          [Start guided timer]   clock blocks run in Guided
 *
 * The current exercise expands to a compact action strip (Details · Complete set N · Complete exercise). Rest is never shown; nothing here
 * starts a timer except the Start guided timer button (which switches to Guided at the block's Ready card).
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { SafeLinearGradient as LinearGradient } from '../../SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../../constants/brand';
import type { OverviewBlock, OverviewEdge, OverviewModel, OverviewRow } from '../../../utils/v3Session/overview';
import { ExerciseThumb } from '../ExerciseThumb';

interface Props {
  model: OverviewModel;
  bottomInset: number;
  canFinish: boolean;
  onJump: (step: number) => void;
  onCompleteStep: (step: number) => void;
  onUncompleteStep: (step: number) => void;
  onDetails: (itemId: string) => void;
  onStartClock: (readyStep: number) => void;
  /** "Complete exercise": every remaining set of the row counts as done (replaces Skip; skipping lives in Guided's More) */
  onCompleteRow: (row: OverviewRow) => void;
  onFinish: () => void;
  onEdge: (edge: OverviewEdge, done: boolean) => void;
}

export function OverviewView(p: Props) {
  const { model } = p;
  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: p.bottomInset + 110 }]} showsVerticalScrollIndicator={false} testID="v3-overview">
      {model.warmup ? <EdgeRow edge={model.warmup} onPress={() => p.onEdge(model.warmup!, model.warmup!.state !== 'done')} /> : null}
      {model.blocks.map((b) => (
        <BlockCard key={b.key} block={b} p={p} />
      ))}
      {model.cooldown ? <EdgeRow edge={model.cooldown} onPress={() => p.onEdge(model.cooldown!, model.cooldown!.state !== 'done')} /> : null}
      <Pressable onPress={p.onFinish} disabled={!p.canFinish} style={({ pressed }) => [{ marginTop: 26, opacity: p.canFinish ? 1 : 0.45 }, pressed && { opacity: 0.85 }]} testID="v3-overview-finish">
        <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.finish as any}>
          <Text style={styles.finishText}>Finish workout</Text>
        </LinearGradient>
      </Pressable>
      {!p.canFinish ? <Text style={styles.finishNote}>Finish needs at least one completed set.</Text> : null}
    </ScrollView>
  );
}

function EdgeRow({ edge, onPress }: { edge: OverviewEdge; onPress: () => void }) {
  const done = edge.state === 'done' || edge.state === 'skipped';
  return (
    <Pressable onPress={onPress} style={[styles.edge, edge.state === 'current' && styles.edgeCurrent]} testID={`v3-overview-${edge.kind}`}>
      <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={done ? COLORS.accent : 'rgba(255,255,255,0.35)'} />
      <Text style={[styles.edgeText, done && { opacity: 0.55 }]}>{edge.label}</Text>
      <Text style={styles.edgeHint}>{done ? 'Done' : 'Tap when done'}</Text>
    </Pressable>
  );
}

function BlockCard({ block, p }: { block: OverviewBlock; p: Props }) {
  const main = block.emphasis === 'main';
  const cp = block.clockProgress;
  return (
    <View style={[styles.block, block.state === 'current' && styles.blockCurrent]} testID={`v3-overview-block-${block.key}`}>
      <View style={styles.head}>
        <Text style={[styles.label, main && styles.labelMain]}>{block.label}</Text>
        {block.sublabel ? <Text style={styles.sublabel}>{block.sublabel}</Text> : null}
        <View style={{ flex: 1 }} />
        {block.state === 'done' ? <Ionicons name="checkmark-circle" size={16} color={COLORS.accent} /> : null}
        {block.clock && cp && cp.done > 0 && block.state !== 'done' ? <Text style={styles.clockProgress}>{`${cp.done} / ${cp.total}`}</Text> : null}
      </View>
      <View style={[styles.rows, block.grouped && styles.grouped]}>
        {block.rows.map((r, i) => (
          <Row key={r.key} row={r} block={block} first={i === 0} p={p} />
        ))}
      </View>
      {block.clock && block.state !== 'done' ? (
        <Pressable onPress={() => p.onStartClock(block.readyStep)} style={({ pressed }) => [styles.clockBtn, pressed && { opacity: 0.8 }]} testID={`v3-overview-clock-${block.key}`}>
          <Ionicons name="timer-outline" size={16} color={COLORS.textPrimary} />
          <Text style={styles.clockBtnText}>{block.state === 'current' || (cp && cp.done > 0) ? 'Open guided timer' : 'Start guided timer'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * The set bubble: a ring that fills by exact fraction (2 of 4 sets = half, 1 of 3 = a third) with the count inside; a tick
 * when every set is done, a dash when skipped. Tap: complete the next set; long-press: undo the last one.
 */
export function SetRing({ done, total, state, size = 30 }: { done: number; total: number; state: OverviewRow['state']; size?: number }) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.max(0, Math.min(1, done / total)) : 0;
  const complete = state === 'done';
  const skipped = state === 'skipped';
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} testID={`v3-set-ring-${done}-${total}`}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={skipped ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.16)'} strokeWidth={stroke} fill={complete ? COLORS.accent : 'none'} />
        {!complete && frac > 0 ? (
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={COLORS.accent} strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - frac)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        ) : null}
      </Svg>
      {complete ? (
        <Ionicons name="checkmark" size={16} color={COLORS.accentInk} />
      ) : skipped ? (
        <Ionicons name="remove" size={14} color="rgba(255,255,255,0.4)" />
      ) : total > 1 ? (
        <Text style={{ fontSize: 10, fontWeight: '800', color: done > 0 ? COLORS.textPrimary : 'rgba(255,255,255,0.45)', fontVariant: ['tabular-nums'] }}>{done}</Text>
      ) : null}
    </View>
  );
}

function Row({ row, block, first, p }: { row: OverviewRow; block: OverviewBlock; first: boolean; p: Props }) {
  const main = block.emphasis === 'main';
  const current = row.state === 'current';
  const done = row.state === 'done';
  const icon = done ? 'checkmark-circle' : row.state === 'skipped' ? 'remove-circle-outline' : row.state === 'partial' ? 'contrast' : 'ellipse-outline';
  const color = done || row.state === 'partial' ? COLORS.accent : row.state === 'skipped' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.35)';
  return (
    <View style={[!first && styles.divider, current && styles.rowCurrent]}>
      <View style={styles.row}>
        {row.marker ? <Text style={[styles.marker, row.marker === 'ANCHOR' && styles.markerAnchor]}>{row.marker}</Text> : null}
        {!block.clock ? (
          <Pressable
            onPress={() => (row.nextOpen != null ? p.onCompleteStep(row.nextOpen) : row.lastDone != null ? p.onUncompleteStep(row.lastDone) : undefined)}
            onLongPress={() => row.lastDone != null && p.onUncompleteStep(row.lastDone)}
            hitSlop={10}
            accessibilityLabel={row.nextOpen != null ? `Complete set ${row.setsDone + 1} of ${row.name}` : `Undo last set of ${row.name}`}
            testID={`v3-overview-check-${row.itemId}`}
          >
            <SetRing done={row.setsDone} total={row.setsTotal} state={row.state} />
          </Pressable>
        ) : (
          <Ionicons name={icon as any} size={22} color={color} />
        )}
        <Pressable onPress={() => p.onJump(row.entryStep ?? 0)} style={styles.rowMain} testID={`v3-overview-row-${row.itemId}`} accessibilityLabel={`${row.name}, ${row.rx}. Make current`}>
          <ExerciseThumb item={row.item} size={main ? 60 : 52} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, main && styles.nameMain, done && { opacity: 0.55 }]} numberOfLines={2}>{row.name}</Text>
            <Text style={styles.rx}>
              {row.rx}
              {row.roundsNote ? <Text style={styles.note}>{`  ${row.roundsNote}`}</Text> : null}
            </Text>
          </View>
          {row.progress ? <Text style={[styles.progress, done && { color: COLORS.accent }]}>{row.progress}</Text> : null}
        </Pressable>
      </View>
      {current && !block.clock ? (
        <View style={styles.strip} testID={`v3-overview-strip-${row.itemId}`}>
          <Pressable onPress={() => p.onDetails(row.itemId)} style={styles.stripBtn} hitSlop={6}>
            <Ionicons name="information-circle-outline" size={15} color={COLORS.textPrimary} />
            <Text style={styles.stripText}>Details</Text>
          </Pressable>
          {row.nextOpen != null ? (
            <Pressable onPress={() => p.onCompleteStep(row.nextOpen!)} style={[styles.stripBtn, styles.stripPrimary]} hitSlop={6} testID={`v3-overview-complete-${row.itemId}`}>
              <Ionicons name="checkmark" size={15} color={COLORS.accentInk} />
              <Text style={[styles.stripText, { color: COLORS.accentInk }]}>{row.setsTotal > 1 ? `Complete set ${row.setsDone + 1}` : 'Complete'}</Text>
            </Pressable>
          ) : null}
          {row.nextOpen != null && row.setsTotal - row.setsDone > 1 ? (
            <Pressable onPress={() => p.onCompleteRow(row)} style={styles.stripBtn} hitSlop={6} testID={`v3-overview-complete-all-${row.itemId}`} accessibilityLabel={`Complete all remaining sets of ${row.name}`}>
              <Ionicons name="checkmark-done" size={15} color={COLORS.textPrimary} />
              <Text style={styles.stripText}>Complete exercise</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 18, paddingTop: 8 },
  edge: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12, marginTop: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)' },
  edgeCurrent: { backgroundColor: 'rgba(255,255,255,0.07)' },
  edgeText: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  edgeHint: { fontSize: 12, color: COLORS.textTertiary },
  block: { marginTop: 18, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)' },
  blockCurrent: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.14)' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  label: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1.6, color: COLORS.textTertiary },
  labelMain: { color: COLORS.accent },
  sublabel: { fontSize: 11.5, fontWeight: '600', color: COLORS.textTertiary },
  clockProgress: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, fontVariant: ['tabular-nums'] },
  rows: { marginTop: 2 },
  grouped: { borderLeftWidth: 2, borderLeftColor: 'rgba(255,255,255,0.14)', paddingLeft: 10, marginLeft: 2 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.07)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  rowCurrent: { backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 14 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  marker: { width: 22, fontSize: 11.5, fontWeight: '800', color: COLORS.accent, fontVariant: ['tabular-nums'] },
  markerAnchor: { fontSize: 8.5 },
  name: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  nameMain: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  rx: { fontSize: 13.5, fontWeight: '600', color: COLORS.textSecondary, marginTop: 1, fontVariant: ['tabular-nums'] },
  note: { fontSize: 12, color: COLORS.textTertiary },
  progress: { fontSize: 13, fontWeight: '700', color: COLORS.textTertiary, fontVariant: ['tabular-nums'] },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 10, paddingLeft: 40 },
  stripBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.08)' },
  stripPrimary: { backgroundColor: COLORS.accent },
  stripText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  clockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 44, borderRadius: 14, marginTop: 8, marginBottom: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)' },
  clockBtnText: { fontSize: 14.5, fontWeight: '700', color: COLORS.textPrimary },
  finish: { height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  finishText: { fontSize: 17, fontWeight: '800', color: COLORS.accentInk },
  finishNote: { fontSize: 12.5, color: COLORS.textTertiary, textAlign: 'center', marginTop: 8 },
});
