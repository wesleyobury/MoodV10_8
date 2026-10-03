/**
 * Ring goals sheet (founder pass, Oct 2026): where the athlete sets their own minutes and calories goals.
 * Opened from the Goals chip on the share screen (and by tapping the card). Each goal is either automatic
 * (minutes: match the workout; calories: scaled to the workout) or a fixed number set with - / +.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../../SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../../constants/brand';
import { CALORIES_RANGE, MINUTES_RANGE, RingGoalPrefs } from '../../../utils/v3Session/goalStore';

interface Props {
  visible: boolean;
  prefs: RingGoalPrefs;
  /** what "automatic" resolves to for this workout, shown on the auto option */
  auto: { minutes: number; calories: number };
  bottomInset: number;
  onClose: () => void;
  onSave: (p: RingGoalPrefs) => void;
}

function Stepper({ value, range, unit, onChange }: { value: number; range: { min: number; max: number; step: number }; unit: string; onChange: (v: number) => void }) {
  const hold = useRef<ReturnType<typeof setInterval> | null>(null);
  const cur = useRef(value);
  cur.current = value;
  const bump = (dir: 1 | -1) => {
    const next = Math.max(range.min, Math.min(range.max, Math.round(cur.current / range.step) * range.step + dir * range.step));
    if (next !== cur.current) { Haptics.selectionAsync().catch(() => undefined); onChange(next); cur.current = next; }
  };
  const stop = () => { if (hold.current) clearInterval(hold.current); hold.current = null; };
  useEffect(() => stop, []);
  const Btn = ({ dir }: { dir: 1 | -1 }) => (
    <Pressable
      onPress={() => bump(dir)}
      onLongPress={() => { stop(); hold.current = setInterval(() => bump(dir), 90); }}
      onPressOut={stop}
      delayLongPress={300}
      hitSlop={6}
      style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}
      accessibilityLabel={dir > 0 ? 'Increase' : 'Decrease'}
    >
      <Ionicons name={dir > 0 ? 'add' : 'remove'} size={20} color={COLORS.textPrimary} />
    </Pressable>
  );
  return (
    <View style={styles.stepper}>
      <Btn dir={-1} />
      <View style={{ alignItems: 'center', minWidth: 96 }}>
        <Text style={styles.stepV}>{value}</Text>
        <Text style={styles.stepK}>{unit}</Text>
      </View>
      <Btn dir={1} />
    </View>
  );
}

function GoalRow(p: { label: string; autoLabel: string; autoValue: string; value: number | null; fallback: number; range: { min: number; max: number; step: number }; unit: string; onChange: (v: number | null) => void; testID: string }) {
  const isAuto = p.value == null;
  return (
    <View style={styles.row} testID={p.testID}>
      <Text style={styles.rowLabel}>{p.label}</Text>
      <View style={styles.seg}>
        <Pressable onPress={() => p.onChange(null)} style={[styles.segBtn, isAuto && styles.segOn]}>
          <Text style={[styles.segText, isAuto && styles.segTextOn]} numberOfLines={1}>{`${p.autoLabel} · ${p.autoValue}`}</Text>
        </Pressable>
        <Pressable onPress={() => p.onChange(p.value ?? p.fallback)} style={[styles.segBtn, !isAuto && styles.segOn]}>
          <Text style={[styles.segText, !isAuto && styles.segTextOn]}>My goal</Text>
        </Pressable>
      </View>
      {!isAuto ? <Stepper value={p.value!} range={p.range} unit={p.unit} onChange={(v) => p.onChange(v)} /> : null}
    </View>
  );
}

export function GoalsSheet({ visible, prefs, auto, bottomInset, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<RingGoalPrefs>(prefs);
  useEffect(() => { if (visible) setDraft(prefs); }, [visible, prefs]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: bottomInset + 16 }]} testID="v3-goals-sheet">
        <View style={styles.grab} />
        <Text style={styles.title}>Your ring goals</Text>
        <Text style={styles.hint}>The rings fill toward these every workout.</Text>
        <GoalRow
          label="MINUTES" autoLabel="Match workout" autoValue={`${auto.minutes} min`} unit="minutes"
          value={draft.minutes} fallback={auto.minutes} range={MINUTES_RANGE}
          onChange={(v) => setDraft((d) => ({ ...d, minutes: v }))} testID="v3-goals-minutes"
        />
        <GoalRow
          label="CALORIES" autoLabel="Auto" autoValue={`${auto.calories} cal`} unit="calories"
          value={draft.calories} fallback={auto.calories} range={CALORIES_RANGE}
          onChange={(v) => setDraft((d) => ({ ...d, calories: v }))} testID="v3-goals-calories"
        />
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined); onSave(draft); }} testID="v3-goals-save" style={({ pressed }) => [{ marginTop: 22 }, pressed && { opacity: 0.9 }]}>
          <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.save as any}>
            <Text style={styles.saveText}>Save goals</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { backgroundColor: COLORS.sheet, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 22, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  grab: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.4 },
  hint: { fontSize: 13.5, color: COLORS.textTertiary, marginTop: 4 },
  row: { marginTop: 22 },
  rowLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.6, color: COLORS.textTertiary, marginBottom: 8 },
  seg: { flexDirection: 'row', gap: 8 },
  segBtn: { flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  segOn: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  segText: { fontSize: 13.5, fontWeight: '700', color: COLORS.textPrimary },
  segTextOn: { color: COLORS.accentInk },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  stepBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' },
  stepV: { fontSize: 30, fontWeight: '300', color: COLORS.textPrimary, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  stepK: { fontSize: 11, color: COLORS.textTertiary, marginTop: 1 },
  save: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 17, fontWeight: '800', color: COLORS.accentInk },
});
