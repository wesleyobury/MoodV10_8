/**
 * PreviewSections: the body of the Workout Preview (Phase 2.6). The workout itself is the visual focus, so rows sit on
 * the page with hairline dividers instead of a card per section. Content only, shared by the Preview and the dev pack.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/brand';
import type { V3Workout } from '../../utils/v3Api';
import { previewSections } from '../../utils/v3PreviewFormat';

export function PreviewSections({ workout }: { workout: V3Workout }) {
  const sections = previewSections(workout);
  return (
    <View testID="v3-preview-sections">
      {sections.map((s) => (
        <View key={s.key} style={styles.section} testID={`v3-preview-section-${s.key}`}>
          <View style={styles.head}>
            <Text style={styles.label}>{s.label}</Text>
            {s.caption ? <Text style={styles.caption}>{s.caption}</Text> : null}
          </View>
          <View style={s.grouped ? styles.grouped : null}>
            {s.rows.map((r, i) => {
              const numeric = !!r.tag && /^\d+$/.test(r.tag);
              return (
                <View key={r.key} style={[styles.row, i > 0 && styles.divider]}>
                  {r.tag ? (
                    <View style={[styles.tag, numeric && styles.tagNum, r.tag === 'ANCHOR' && styles.tagAnchor]}>
                      <Text style={[styles.tagText, numeric && styles.tagTextNum]}>{r.tag}</Text>
                    </View>
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <View style={styles.top}>
                      <Text style={styles.name} numberOfLines={2}>
                        {r.name}
                      </Text>
                      <Text style={styles.detail}>{r.detail}</Text>
                    </View>
                    {r.note ? (
                      <Text style={styles.note} numberOfLines={2}>
                        {r.note}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 26 },
  head: { marginBottom: 4 },
  label: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1.7, color: COLORS.accent },
  caption: { fontSize: 12.5, color: COLORS.textTertiary, marginTop: 3 },
  grouped: { borderLeftWidth: 2, borderLeftColor: 'rgba(255,215,0,0.5)', paddingLeft: 12, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)' },
  top: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  detail: { fontSize: 14.5, fontWeight: '700', color: COLORS.textSecondary },
  note: { fontSize: 12, lineHeight: 17, color: COLORS.textTertiary, marginTop: 3 },
  tag: { minWidth: 30, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7, backgroundColor: 'rgba(255,215,0,0.14)', alignItems: 'center' },
  tagNum: { backgroundColor: 'transparent', minWidth: 18, paddingHorizontal: 0 },
  tagAnchor: { backgroundColor: 'rgba(255,255,255,0.1)' },
  tagText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5, color: COLORS.accent },
  tagTextNum: { fontSize: 14, color: COLORS.textTertiary, letterSpacing: 0 },
});
