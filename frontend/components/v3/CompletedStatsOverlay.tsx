/**
 * Completed workout stats (Profile > Workout History > Cart in completed mode > Stats).
 *
 * The same "Share your workout" screen the Guided Session ends on (session/CompleteScreen Share: numbers, Rings / Simple /
 * Heart rate overlays, Instagram Story / Share), rebuilt from what the server recorded for this workout
 * (GET /api/v3/me/completed/{id}). Real data only: minutes from the session clock, sets from the weight logger, calories and
 * heart rate only from the wearable or the athlete's own entry. Edits save through POST /api/v3/workouts/{id}/after.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/brand';
import type { V3Workout } from '../../utils/v3Api';
import { afterV3Workout, getV3Workout } from '../../utils/v3Api';
import { cartScan } from '../../utils/v3CartFormat';
import { CompletedStats, getCompletedStats } from '../../utils/v3ExploreApi';
import type { AfterIntent, SessionRecord } from '../../utils/v3Session/record';
import { Share } from './session/CompleteScreen';
import type { ShareData } from './session/ShareCard';
import { caloriesGoal, minutesGoal } from '../../utils/v3Session/ringGoals';

interface Props {
  visible: boolean;
  token: string | null;
  /** the workout when the caller has it (the Cart); otherwise it is loaded by id (Profile history) */
  workout?: V3Workout | null;
  workoutId?: string | null;
  onClose: () => void;
}

export function CompletedStatsOverlay({ visible, token, workout: given, workoutId, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<CompletedStats | null>(null);
  const [loaded, setLoaded] = useState<V3Workout | null>(null);
  const [failed, setFailed] = useState(false);
  const workout = given ?? loaded;
  const id = given?.workout_id ?? workoutId ?? null;

  useEffect(() => {
    setStats(null);
    setLoaded(null);
    setFailed(false);
  }, [id]);

  useEffect(() => {
    if (!visible || !token || !id) return;
    let alive = true;
    (async () => {
      const [s, w] = await Promise.all([stats ? stats : getCompletedStats(token, id), given || loaded ? null : getV3Workout(token, id)]);
      if (!alive) return;
      if (w && w.ok && w.envelope.workout) setLoaded(w.envelope.workout);
      if (s) setStats(s);
      if (!s || (w && !(w.ok && w.envelope.workout))) setFailed(true);
    })();
    return () => {
      alive = false;
    };
  }, [visible, token, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const view = useMemo(() => {
    if (!stats || !workout) return null;
    const a = stats.after || {};
    const doneAt = stats.completed_at ? Date.parse(stats.completed_at) : Date.now();
    const minutes = stats.duration_actual ?? null;
    const startedAt = stats.started_at ? Date.parse(stats.started_at) : minutes ? doneAt - minutes * 60000 : doneAt;
    const data: ShareData = {
      title: workout.archetype?.name ?? workout.direction_name,
      direction: workout.direction_name,
      dateLabel: new Date(doneAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase(),
      minutes,
      sets: stats.sets || null,
      intervals: null,
      calories: a.calories ?? null,
      avgHr: a.avg_heart_rate ?? null,
      maxHr: a.max_heart_rate ?? null,
      steps: a.steps ?? null,
      hrv: a.hrv_sdnn ?? null,
      hrFromWearable: a.metrics_source === 'wearable',
      streak: null,
      exercises: workout.blocks.flatMap((b) => b.items.map((it) => it.exercise.name)),
      blocks: cartScan(workout).map((b) => ({ label: b.label, lines: b.rows.map((r) => `${r.name} · ${r.rx}`) })),
      seed: workout.workout_id ?? 'done',
      minutesGoal: minutesGoal(workout.duration?.requested_minutes),
      caloriesGoal: caloriesGoal(workout.direction, minutesGoal(workout.duration?.requested_minutes)),
    };
    // the share screen reads only startedAt / endedAt (wearable sync window) and `after` from the session record
    const record = {
      startedAt: Number.isFinite(startedAt) ? startedAt : doneAt,
      endedAt: doneAt,
      after: {
        fit_rating: (stats.fit_rating as any) ?? null, calories: a.calories ?? null, avg_heart_rate: a.avg_heart_rate ?? null,
        max_heart_rate: a.max_heart_rate ?? null, steps: a.steps ?? null, hrv_sdnn: a.hrv_sdnn ?? null, duration_actual: minutes,
        source: a.metrics_source ?? null, dirty: false, attempts: 0, nextAttemptAt: 0, syncedAt: null,
      },
    } as unknown as SessionRecord;
    return { data, record };
  }, [stats, workout]);

  const saveAfter = (patch: Partial<AfterIntent>) => {
    // keep the overlay's copy current so reopening it shows what was just typed
    setStats((cur) => (cur ? { ...cur, duration_actual: typeof patch.duration_actual === 'number' ? patch.duration_actual : cur.duration_actual, after: { ...cur.after, ...Object.fromEntries(Object.entries(patch).filter(([k, v]) => typeof v === 'number' && k !== 'duration_actual')), ...(patch.source ? { metrics_source: patch.source } : {}) } } : cur));
    if (!token || !id) return;
    const body: Record<string, any> = {};
    for (const k of ['calories', 'avg_heart_rate', 'max_heart_rate', 'steps', 'hrv_sdnn', 'duration_actual'] as const) {
      const v = patch[k];
      if (typeof v === 'number') body[k] = v;
    }
    if (patch.source) body.metrics_source = patch.source;
    if (Object.keys(body).length) afterV3Workout(token, id, body).catch(() => undefined);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <View style={[styles.root, { paddingTop: insets.top + 8 }]} testID="v3-completed-stats">
        {/* the share screen has its own Done; the close button is only for the loading / error state */}
        {!view ? (
          <Pressable onPress={onClose} hitSlop={12} style={[styles.close, { top: insets.top + 10 }]} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={COLORS.textPrimary} />
          </Pressable>
        ) : null}
        {view ? (
          <Share data={view.data} record={view.record} insets={{ top: insets.top, bottom: insets.bottom }} onSaveAfter={saveAfter} onDone={onClose} />
        ) : (
          <View style={styles.center}>
            {failed ? <Text style={styles.err}>Couldn’t load this workout’s stats.</Text> : <ActivityIndicator color={COLORS.accent} />}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  err: { fontSize: 14, color: COLORS.textSecondary },
  close: { position: 'absolute', right: 18, zIndex: 5, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
});
