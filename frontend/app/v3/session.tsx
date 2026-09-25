/**
 * V3 Session — Phase 3 handoff point. /v3/session?id=<workout_id>
 *
 * Phase 2 ends at the Overview. The guided V3 player (timers, set logging,
 * POST /api/v3/workouts/{id}/complete) is Phase 3 and will replace this screen.
 * Until then this is a safe, honest stop: it never forces a V3 workout into
 * the V2 cart / player structures and never marks anything complete.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { V3Envelope } from '../../utils/v3Api';
import { readCachedEnvelope } from '../../utils/v3Today';

export default function V3SessionPlaceholder() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const [env, setEnv] = useState<V3Envelope | null>(null);

  useEffect(() => {
    if (user?.id && id) readCachedEnvelope(user.id, id).then(setEnv);
  }, [user?.id, id]);

  const w = env?.workout;
  const items = w ? w.blocks.flatMap((b) => b.items.map((i) => ({ block: b.title, name: i.exercise.name, rx: i.prescription.display, id: i.item_id }))) : [];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6 }]} testID="v3-session-placeholder">
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back} accessibilityLabel="Back">
        <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
      </Pressable>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <Text style={styles.eyebrow}>{w ? `${w.direction_name.toUpperCase()} · ${w.duration.display}` : 'TODAY'}</Text>
        <Text style={styles.title}>{w?.archetype.name ?? 'Your workout'}</Text>
        <View style={styles.note}>
          <Ionicons name="construct-outline" size={16} color={COLORS.accent} />
          <Text style={styles.noteText}>
            Guided sessions for the new workouts are coming in the next build. For now, follow along below and go at your own pace.
          </Text>
        </View>
        {items.map((it, i) => (
          <View key={it.id} style={[styles.row, i > 0 && styles.divider]}>
            <Text style={styles.idx}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{it.name}</Text>
              <Text style={styles.meta}>{it.block}</Text>
            </View>
            <Text style={styles.rx}>{it.rx}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  back: { marginLeft: 12, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2, color: COLORS.accent },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.textPrimary, marginTop: 6, letterSpacing: -0.5 },
  note: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  noteText: { flex: 1, fontSize: 13.5, lineHeight: 20, color: COLORS.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  idx: { width: 20, fontSize: 13, fontWeight: '700', color: COLORS.textTertiary },
  name: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  meta: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },
  rx: { fontSize: 14, fontWeight: '600', color: COLORS.accent, maxWidth: '40%', textAlign: 'right' },
});
