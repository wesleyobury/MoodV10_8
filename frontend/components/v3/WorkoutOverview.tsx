/**
 * WorkoutOverview — the one V3 workout renderer (Strength, Sweat, Athletic).
 *
 *   header (Direction · title · Target · duration.display · facts)
 *   Adjusted for today (rerouted only; API text)
 *   Built for Today (API `built_for_today`, verbatim)
 *   Warm-up → blocks → cool-down
 *
 * Content only (no scroll container, no actions) so the Overview screen, the
 * dev pack viewer and a future session screen can all reuse it.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/brand';
import type { V3Envelope, V3Item } from '../../utils/v3Api';
import { STATE_LABEL } from '../../utils/v3HomeModel';
import { exerciseCount, rerouteNotice, workoutTitle } from '../../utils/v3OverviewFormat';
import { BlockCard } from './BlockCard';
import { ExerciseThumb } from './ExerciseThumb';

interface Props {
  envelope: V3Envelope;
  onSwap?: (item: V3Item) => void;
  swappingItemId?: string | null;
  highlightItemId?: string | null;
}

export function WorkoutOverview({ envelope, onSwap, swappingItemId, highlightItemId }: Props) {
  const w = envelope.workout;
  if (!w) return null;
  const { title, subtitle } = workoutTitle(w);
  const reroute = rerouteNotice(w, envelope.outcome);
  const built = w.built_for_today.filter((l) => !(reroute && l.text === reroute));
  const facts = [
    w.duration.display,
    `${exerciseCount(w)} exercises`,
    w.equipment.preset !== 'commercial_gym' ? w.equipment.label : null,
  ].filter(Boolean) as string[];

  return (
    <View testID="v3-overview">
      {/* Identity */}
      <Text style={styles.eyebrow}>{w.direction_name.toUpperCase()}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.facts}>
        {facts.map((f, i) => (
          <View key={f} style={styles.factRow}>
            {i > 0 ? <View style={styles.dot} /> : null}
            <Text style={styles.fact}>{f}</Text>
          </View>
        ))}
      </View>
      {w.states.length ? (
        <View style={styles.stateRow}>
          {w.states.map((s) => (
            <View key={s} style={styles.statePill}>
              <Text style={styles.statePillText}>
                {s === 'sore' && w.soreness.regions.length
                  ? `Sore · ${w.soreness.regions.map((r) => r.replace(/_/g, ' ')).join(', ')}`
                  : STATE_LABEL[s] ?? s}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Rerouted: calm, specific, from the API */}
      {reroute ? (
        <View style={styles.reroute} testID="v3-reroute">
          <Ionicons name="git-branch-outline" size={16} color={COLORS.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rerouteTitle}>Adjusted for today</Text>
            <Text style={styles.rerouteText}>{reroute}</Text>
          </View>
        </View>
      ) : null}

      {/* Built for Today */}
      {built.length ? (
        <View style={styles.bft} testID="v3-built-for-today">
          <View style={styles.bftHead}>
            <Ionicons name="sparkles" size={14} color={COLORS.accent} />
            <Text style={styles.bftTitle}>BUILT FOR TODAY</Text>
          </View>
          {built.map((l) => (
            <View key={l.code + l.text} style={styles.bftLine}>
              <View style={styles.bftBullet} />
              <Text style={styles.bftText}>{l.text}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Warm-up */}
      {w.warmup && (w.warmup.guidance || w.warmup.items.length) ? (
        <View style={styles.side} testID="v3-warmup">
          <View style={styles.sideHead}>
            <Text style={styles.sideTitle}>Warm-up</Text>
            {w.warmup.minutes ? <Text style={styles.sideMin}>{Math.round(w.warmup.minutes)} min</Text> : null}
          </View>
          {w.warmup.items.length ? (
            w.warmup.items.map((it, i) => (
              <View key={`${it.name}-${i}`} style={styles.wuRow}>
                <ExerciseThumb item={it} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.wuName}>{it.name}</Text>
                  <Text style={styles.wuMeta}>{[it.component_label, it.prescription_text].filter(Boolean).join(' · ')}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.sideText}>{w.warmup.guidance}</Text>
          )}
        </View>
      ) : null}

      {/* Blocks */}
      {w.blocks.map((b, i) => (
        <BlockCard
          key={b.block_id}
          block={b}
          index={i}
          direction={w.direction}
          onSwap={onSwap}
          swappingItemId={swappingItemId}
          highlightItemId={highlightItemId}
        />
      ))}

      {/* Cool-down */}
      {w.cooldown && w.cooldown.guidance ? (
        <View style={styles.side} testID="v3-cooldown">
          <View style={styles.sideHead}>
            <Text style={styles.sideTitle}>Cool-down</Text>
            {w.cooldown.minutes ? <Text style={styles.sideMin}>{Math.round(w.cooldown.minutes)} min</Text> : null}
          </View>
          <Text style={styles.sideText}>{w.cooldown.guidance}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2.2, color: COLORS.accent },
  title: { fontSize: 32, lineHeight: 37, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.6, marginTop: 6 },
  subtitle: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary, marginTop: 4 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 10 },
  factRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.35)', marginHorizontal: 8 },
  fact: { fontSize: 13.5, color: COLORS.textSecondary, fontWeight: '500' },
  stateRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 12 },
  statePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)' },
  statePillText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, textTransform: 'capitalize' },
  soreText: { fontSize: 12, color: COLORS.textTertiary, marginLeft: 4, textTransform: 'capitalize' },
  reroute: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  rerouteTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  rerouteText: { fontSize: 13.5, lineHeight: 19, color: COLORS.textSecondary, marginTop: 2 },
  bft: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.28)',
  },
  bftHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  bftTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8, color: COLORS.accent },
  bftLine: { flexDirection: 'row', gap: 10, marginTop: 7 },
  bftBullet: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.textPrimary, marginTop: 8, opacity: 0.7 },
  bftText: { flex: 1, fontSize: 14.5, lineHeight: 21, color: COLORS.textPrimary },
  side: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  sideHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sideTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary },
  sideMin: { fontSize: 12.5, color: COLORS.textTertiary },
  sideText: { fontSize: 13, lineHeight: 19, color: COLORS.textTertiary, marginTop: 6 },
  wuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  wuName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  wuMeta: { fontSize: 12, color: COLORS.textTertiary, marginTop: 1 },
});
