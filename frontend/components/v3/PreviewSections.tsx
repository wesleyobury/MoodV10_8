/**
 * PreviewSections: the compact structural body of the Workout Preview (Phase 2.5): one labelled section per
 * structure (STRAIGHT SETS, SUPERSET A1/A2, CIRCUIT, HYBRID anchor + stations, EMOM, ATHLETIC EXPOSURE...).
 * Content only, so the Preview screen and the dev pack viewer share it.
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
          <Text style={styles.sectionLabel}>{s.label}</Text>
          {s.caption ? <Text style={styles.sectionCaption}>{s.caption}</Text> : null}
          <View style={[styles.rows, s.grouped && styles.rowsGrouped]}>
            {s.rows.map((r, i) => (
              <View key={r.key} style={[styles.row, i > 0 && styles.rowDivider]}>
                {r.tag ? (
                  <View style={[styles.tag, r.tag === 'ANCHOR' && styles.tagAnchor]}>
                    <Text style={styles.tagText}>{r.tag}</Text>
                  </View>
                ) : null}
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowName} numberOfLines={2}>
                      {r.name}
                    </Text>
                    <Text style={styles.rowDetail}>{r.detail}</Text>
                  </View>
                  {r.note ? (
                    <Text style={styles.rowNote} numberOfLines={2}>
                      {r.note}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 20 },
  sectionLabel: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1.7, color: COLORS.textSecondary },
  sectionCaption: { fontSize: 12.5, color: COLORS.textTertiary, marginTop: 3 },
  rows: {
    marginTop: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rowsGrouped: { borderLeftWidth: 2, borderLeftColor: 'rgba(255,215,0,0.55)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  rowName: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  rowDetail: { fontSize: 13.5, fontWeight: '600', color: COLORS.textSecondary },
  rowNote: { fontSize: 12, lineHeight: 17, color: COLORS.textTertiary, marginTop: 3 },
  tag: { minWidth: 28, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7, backgroundColor: 'rgba(255,215,0,0.14)', alignItems: 'center' },
  tagAnchor: { backgroundColor: 'rgba(255,255,255,0.1)' },
  tagText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: COLORS.accent },

});
