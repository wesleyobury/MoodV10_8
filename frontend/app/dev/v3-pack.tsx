/**
 * /dev/v3-pack — dev-only viewer that runs the MOOD V3 production output pack
 * (backend/mood_v3/qa/results, 15 workouts + special cases) through the real
 * V3 renderer, with no backend. For visual QA of every Direction / format.
 *
 * Gated by DEV_TOOLS_ENABLED like /dev/screens. Reach it from the DEV pill or
 * by navigating to /dev/v3-pack.
 */
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/brand';
import { DEV_TOOLS_ENABLED } from '../../utils/devFlags';
import type { V3Envelope } from '../../utils/v3Api';
import { WorkoutOverview } from '../../components/v3/WorkoutOverview';
import { V3Chip } from '../../components/v3/V3Chip';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PACK: { key: string; title: string; envelope: V3Envelope }[] = require('../../utils/dev/v3PackFixture.json');

export default function V3PackViewer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [idx, setIdx] = useState(0);
  const entry = PACK[idx];
  const env = entry?.envelope;
  const conflict = useMemo(() => (env?.status === 'conflict' ? env.conflict : null), [env]);

  if (!DEV_TOOLS_ENABLED) return <Redirect href="/" />;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6 }]} testID="v3-pack-viewer">
      <View style={styles.bar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.barTitle}>V3 output pack</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {PACK.map((p, i) => (
          <V3Chip key={p.key} size="sm" label={p.key} selected={i === idx} onPress={() => setIdx(i)} testID={`v3-pack-${p.key}`} />
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <Text style={styles.caseTitle}>
          {entry.title} · outcome {env.outcome}
        </Text>
        {conflict ? (
          <View style={styles.conflict}>
            <Text style={styles.conflictCode}>{conflict.code}</Text>
            <Text style={styles.conflictMsg}>{conflict.message}</Text>
            {conflict.options.map((o, i) => (
              <Text key={i} style={styles.conflictOpt}>
                {o.label} {o.patch ? JSON.stringify(o.patch) : '(opens picker / closes)'}
              </Text>
            ))}
          </View>
        ) : (
          <WorkoutOverview envelope={env} onSwap={() => {}} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  barTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  tabs: { paddingHorizontal: 14, gap: 6, paddingBottom: 8 },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  caseTitle: { fontSize: 12, color: COLORS.textTertiary, marginBottom: 14 },
  conflict: { padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)' },
  conflictCode: { fontSize: 12, fontWeight: '800', color: COLORS.accent, letterSpacing: 1 },
  conflictMsg: { fontSize: 15, color: COLORS.textPrimary, marginTop: 6, lineHeight: 22 },
  conflictOpt: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8 },
});
