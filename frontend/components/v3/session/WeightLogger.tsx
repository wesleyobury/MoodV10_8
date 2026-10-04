/**
 * WeightLogger (F2): optional, secondary to Complete set. Loaded Strength / Athletic strength rows only.
 *
 *   untouched            "+ Log weight" (and "Try 140 lb" when progression suggests it). Nothing is logged.
 *   armed                [−] 135 [+]  lb|kg   ·   [−] 5 reps [+]   ×      (every change is saved to the session record)
 *   next set             carries the previous set's load + reps, shown armed; × = don't log this set
 *
 * Only sets the athlete completes with the row armed become performance (utils/v3Session/record.performanceFromLogs).
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/brand';
import type { V3Item } from '../../../utils/v3Api';
import { SetLog, WeightUnit, carriedLoad, defaultReps, suggestedLoad } from '../../../utils/v3Session/record';
import type { SessionStep } from '../../../utils/v3Session/types';

interface Props {
  item: V3Item;
  step: SessionStep;
  logs: SetLog[] | undefined;
  unit: WeightUnit;
  onUnit: (u: WeightUnit) => void;
  onSave: (log: SetLog) => void;
  onClear: (set: number) => void;
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, ''));

export function WeightLogger({ item, step, logs, unit, onUnit, onSave, onClear }: Props) {
  const set = step.set ?? 1;
  const current = logs?.find((l) => l.set === set) ?? null;
  const prior = (logs ?? []).filter((l) => l.set < set);
  const suggestion = suggestedLoad(item, unit);
  const [text, setText] = useState<string>(current ? fmt(current.load) : '');
  const [open, setOpen] = useState<boolean>(!!current);

  // carry forward into the next set once this exercise has been logged
  useEffect(() => {
    if (current || !prior.length) { setOpen(!!current); setText(current ? fmt(current.load) : ''); return; }
    const load = carriedLoad(prior, unit);
    if (load != null) {
      onSave({ set, load, unit, reps: defaultReps(step, prior) });
      setText(fmt(load));
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  useEffect(() => { if (current) setText(fmt(current.load)); }, [current?.load]);

  const reps = current?.reps ?? defaultReps(step, prior);
  const inc = unit === 'kg' ? 2.5 : 5;

  const save = (load: number | null, r: number | null = reps, u: WeightUnit = unit) => {
    if (load == null || !Number.isFinite(load) || load <= 0) return;
    onSave({ set, load: Math.round(load * 10) / 10, unit: u, reps: r });
  };

  if (!open) {
    return (
      <View style={styles.row}>
        <Pressable
          onPress={() => { setOpen(true); if (suggestion != null) { setText(fmt(suggestion)); save(suggestion); } }}
          hitSlop={8}
          style={styles.link}
          testID="v3-session-log-weight"
        >
          <Ionicons name="add" size={15} color={COLORS.textSecondary} />
          <Text style={styles.linkText}>Log weight</Text>
        </Pressable>
        {suggestion != null ? <Text style={styles.hint}>{`Try ${fmt(suggestion)} ${unit}`}</Text> : null}
      </View>
    );
  }

  const load = current?.load ?? (text ? Number(text) : null);
  return (
    <View style={styles.box} testID="v3-session-weight-logger">
      <View style={styles.group}>
        <Step icon="remove" onPress={() => save(Math.max(0, (load ?? suggestion ?? 0) - inc))} />
        <TextInput
          value={text}
          onChangeText={(v) => { const clean = v.replace(/[^0-9.]/g, ''); setText(clean); const n = parseFloat(clean); if (n > 0) save(n); }}
          keyboardType="decimal-pad"
          placeholder={suggestion != null ? fmt(suggestion) : '0'}
          placeholderTextColor="rgba(255,255,255,0.3)"
          style={styles.input}
          maxLength={6}
          returnKeyType="done"
          testID="v3-session-weight-input"
        />
        <Step icon="add" onPress={() => save((load ?? suggestion ?? 0) + inc)} />
        <Pressable onPress={() => { const u = unit === 'lb' ? 'kg' : 'lb'; onUnit(u); if (load) save(load, reps, u); }} style={styles.unit} hitSlop={6}>
          <Text style={styles.unitText}>{unit}</Text>
        </Pressable>
      </View>
      <View style={styles.group}>
        <Step icon="remove" onPress={() => load && save(load, Math.max(0, (reps ?? 0) - 1))} />
        <Text style={styles.reps}>{reps ?? '–'}</Text>
        <Step icon="add" onPress={() => load && save(load, (reps ?? 0) + 1)} />
        <Text style={styles.repsLabel}>reps</Text>
      </View>
      <Pressable onPress={() => { onClear(set); setText(''); setOpen(false); }} hitSlop={8} accessibilityLabel="Don't log this set" testID="v3-session-weight-clear">
        <Ionicons name="close" size={16} color="rgba(255,255,255,0.45)" />
      </Pressable>
    </View>
  );
}

function Step({ icon, onPress }: { icon: 'add' | 'remove'; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.step, pressed && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={16} color={COLORS.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  linkText: { fontSize: 13.5, fontWeight: '600', color: COLORS.textSecondary },
  hint: { fontSize: 13, color: COLORS.textTertiary },
  box: {
    marginTop: 14,
    alignSelf: 'stretch',
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  group: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  step: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  input: { width: 64, fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', paddingVertical: 2, fontVariant: ['tabular-nums'] },
  unit: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', marginLeft: 2 },
  unitText: { fontSize: 12.5, fontWeight: '700', color: COLORS.textSecondary },
  reps: { minWidth: 22, textAlign: 'center', fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, fontVariant: ['tabular-nums'] },
  repsLabel: { fontSize: 12.5, color: COLORS.textTertiary, marginLeft: 2 },
});
