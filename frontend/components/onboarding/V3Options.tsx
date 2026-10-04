/**
 * V3 onboarding answer surfaces. One design system (dark, gold accent, 14–16 radius), five interactions, so the funnel
 * reads as designed rather than five identical pill lists:
 *
 *   PreferenceCards   training style   cinematic image cards (the Home Direction imagery), 2 × 2
 *   EditorialList     goal             large editorial type on hairlines, no boxes
 *   LadderList        experience       a rising four-rung progression
 *   WeekList          frequency        each option drawn as a training week (M T W T F S S)
 *   StatementCards    barrier          first-person statements
 *
 * Every surface: single select, haptic tick on tap, the chosen option lifts and the rest recede.
 */
import React from 'react';
import { ImageBackground, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';

export interface Opt<T extends string> {
  id: T;
  label: string;
  description?: string;
  /** WeekList: training days drawn */
  days?: number;
  /** PreferenceCards: image */
  image?: ImageSourcePropType;
}

export interface OptionsProps<T extends string> {
  options: Opt<T>[];
  value?: T;
  onChange: (id: T) => void;
  testPrefix: string;
}

const tick = () => Haptics.selectionAsync().catch(() => undefined);

/* ------------------------------------------------------------------ preference: cinematic cards */

export function PreferenceCards<T extends string>({ options, value, onChange, testPrefix }: OptionsProps<T>) {
  return (
    <View style={s.grid}>
      {options.map((o) => {
        const on = value === o.id;
        const dim = !!value && !on;
        return (
          <Pressable
            key={o.id}
            onPress={() => { tick(); onChange(o.id); }}
            style={({ pressed }) => [s.card, on && s.cardOn, pressed && { transform: [{ scale: 0.985 }] }]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            testID={`${testPrefix}-${o.id}`}
          >
            <ImageBackground source={o.image!} resizeMode="cover" fadeDuration={0} style={s.cardImg} imageStyle={{ opacity: dim ? 0.38 : 0.9 }}>
              <LinearGradient colors={['rgba(10,10,10,0)', 'rgba(10,10,10,0.94)']} locations={[0.3, 1]} style={StyleSheet.absoluteFillObject as any} />
              {on ? (
                <View style={s.check}>
                  <Ionicons name="checkmark" size={13} color={COLORS.accentInk} />
                </View>
              ) : null}
              <View style={s.cardText}>
                <Text style={[s.cardName, dim && { color: 'rgba(255,255,255,0.6)' }]}>{o.label}</Text>
                {o.description ? <Text style={s.cardDesc} numberOfLines={2}>{o.description}</Text> : null}
              </View>
            </ImageBackground>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ goal: editorial type */

export function EditorialList<T extends string>({ options, value, onChange, testPrefix }: OptionsProps<T>) {
  return (
    <View>
      {options.map((o, i) => {
        const on = value === o.id;
        const dim = !!value && !on;
        return (
          <Pressable
            key={o.id}
            onPress={() => { tick(); onChange(o.id); }}
            style={[s.edRow, i === 0 && { borderTopWidth: StyleSheet.hairlineWidth }]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            testID={`${testPrefix}-${o.id}`}
          >
            <View style={[s.edMark, on && s.edMarkOn]} />
            <Text style={[s.edLabel, dim && s.edLabelDim, on && s.edLabelOn]}>{o.label}</Text>
            {on ? <Ionicons name="checkmark" size={18} color={COLORS.accent} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ experience: rising ladder */

export function LadderList<T extends string>({ options, value, onChange, testPrefix }: OptionsProps<T>) {
  const n = options.length;
  return (
    <View style={{ gap: 8 }}>
      {options.map((o, i) => {
        const on = value === o.id;
        const dim = !!value && !on;
        return (
          <Pressable
            key={o.id}
            onPress={() => { tick(); onChange(o.id); }}
            style={({ pressed }) => [s.row, on && s.rowOn, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            testID={`${testPrefix}-${o.id}`}
          >
            <View style={s.bars}>
              {Array.from({ length: n }).map((_, k) => {
                const filled = k <= i;
                return (
                  <View
                    key={k}
                    style={[
                      s.bar,
                      { height: 7 + k * 5 },
                      filled ? (on ? s.barOn : s.barFilled) : s.barEmpty,
                    ]}
                  />
                );
              })}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowLabel, dim && s.rowLabelDim]}>{o.label}</Text>
              {o.description ? <Text style={s.rowDesc}>{o.description}</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ frequency: a week, drawn */

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
/** Which weekdays light up for N training days: spread out, the way a real week is. */
export function weekPattern(days: number): number[] {
  if (days <= 1) return [2];
  if (days === 2) return [1, 4];
  if (days === 3) return [0, 2, 4];
  if (days === 4) return [0, 1, 3, 4];
  if (days === 5) return [0, 1, 2, 3, 4];
  return [0, 1, 2, 3, 4, 5];
}

export function WeekList<T extends string>({ options, value, onChange, testPrefix }: OptionsProps<T>) {
  return (
    <View style={{ gap: 10 }}>
      {options.map((o) => {
        const on = value === o.id;
        const dim = !!value && !on;
        const lit = weekPattern(o.days ?? 0);
        return (
          <Pressable
            key={o.id}
            onPress={() => { tick(); onChange(o.id); }}
            style={({ pressed }) => [s.weekRow, on && s.rowOn, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            testID={`${testPrefix}-${o.id}`}
          >
            <View style={s.weekHead}>
              <Text style={[s.rowLabel, dim && s.rowLabelDim]}>{o.label}</Text>
              {o.description ? <Text style={s.rowDesc}>{o.description}</Text> : null}
            </View>
            <View style={s.week}>
              {WEEK.map((d, k) => {
                const isOn = lit.includes(k);
                return (
                  <View key={k} style={s.day}>
                    {isOn && on ? (
                      <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.dayDot} />
                    ) : (
                      <View style={[s.dayDot, isOn ? s.dayDotLit : s.dayDotOff]} />
                    )}
                    <Text style={[s.dayLetter, isOn && on && { color: COLORS.textSecondary }]}>{d}</Text>
                  </View>
                );
              })}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ barrier: statements */

export function StatementCards<T extends string>({ options, value, onChange, testPrefix }: OptionsProps<T>) {
  return (
    <View style={{ gap: 8 }}>
      {options.map((o) => {
        const on = value === o.id;
        const dim = !!value && !on;
        return (
          <Pressable
            key={o.id}
            onPress={() => { tick(); onChange(o.id); }}
            style={({ pressed }) => [s.stmt, on && s.rowOn, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            testID={`${testPrefix}-${o.id}`}
          >
            <Text style={[s.quoteMark, on && { color: COLORS.accent }]}>“</Text>
            <Text style={[s.stmtText, dim && s.rowLabelDim]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ styles */

const s = StyleSheet.create({
  // cards
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  card: {
    width: '48.6%',
    height: 168,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: COLORS.surface,
  },
  cardOn: { borderColor: COLORS.accent, borderWidth: 1.5 },
  cardImg: { flex: 1, justifyContent: 'flex-end' },
  cardText: { padding: 12 },
  cardName: { fontSize: 19, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  cardDesc: { marginTop: 3, fontSize: 12, lineHeight: 16, color: 'rgba(255,255,255,0.7)' },
  check: {
    position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
  },
  // editorial
  edRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 17,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)',
  },
  edMark: { width: 3, height: 22, borderRadius: 2, marginRight: 14, backgroundColor: 'transparent' },
  edMarkOn: { backgroundColor: COLORS.accent },
  edLabel: { flex: 1, fontSize: 21, lineHeight: 26, fontWeight: '600', color: 'rgba(255,255,255,0.86)', letterSpacing: -0.4 },
  edLabelOn: { color: COLORS.textPrimary, fontWeight: '700' },
  edLabelDim: { color: 'rgba(255,255,255,0.4)' },
  // shared rows
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 13, paddingHorizontal: 16, borderRadius: 14,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  rowOn: { borderColor: COLORS.accent, backgroundColor: 'rgba(255,215,0,0.05)' },
  rowLabel: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.2 },
  rowLabelDim: { color: 'rgba(255,255,255,0.5)' },
  rowDesc: { marginTop: 3, fontSize: 13, lineHeight: 18, color: COLORS.textTertiary },
  // ladder
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, width: 34, height: 24 },
  bar: { width: 5, borderRadius: 1.5 },
  barEmpty: { backgroundColor: 'rgba(255,255,255,0.1)' },
  barFilled: { backgroundColor: 'rgba(255,255,255,0.45)' },
  barOn: { backgroundColor: COLORS.accent },
  // week
  weekRow: {
    paddingVertical: 15, paddingHorizontal: 16, borderRadius: 14,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  weekHead: { marginBottom: 12 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 5, width: 30 },
  dayDot: { width: 22, height: 22, borderRadius: 7 },
  dayDotLit: { backgroundColor: 'rgba(255,255,255,0.32)' },
  dayDotOff: { backgroundColor: 'rgba(255,255,255,0.06)' },
  dayLetter: { fontSize: 10, fontWeight: '600', color: COLORS.textTertiary, letterSpacing: 0.4 },
  // statements
  stmt: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingVertical: 15, paddingHorizontal: 16, borderRadius: 14,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  quoteMark: { fontSize: 30, lineHeight: 30, fontWeight: '800', color: 'rgba(255,255,255,0.22)', marginTop: -2 },
  stmtText: { flex: 1, fontSize: 17.5, lineHeight: 23, fontWeight: '600', color: COLORS.textPrimary, letterSpacing: -0.3 },
});
