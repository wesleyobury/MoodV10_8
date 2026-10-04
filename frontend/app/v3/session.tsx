/**
 * V3 Guided Session: /v3/session?id=<workout_id>[&from=home]
 *
 *   Home → Build → Cart → Start Workout → here → Complete → Home
 *
 * Two views over one live session (founder UX pass):
 *   Guided    "Tell me exactly what to do right now, then guide me to the next thing." Current step, coaching, timers.
 *   Overview  the whole workout as a scannable sheet: see where you are, jump anywhere, mark sets, launch a guided timer.
 * The workout envelope is compiled into a normalized Session Plan (utils/v3Session/compile.ts); a timestamp engine
 * (engine.ts) says where the athlete is; both views render the same SessionState, so switching never changes progress. The session survives backgrounding, locking and relaunch (store.ts), completion is recorded
 * exactly once by the server (POST /api/v3/workouts/{id}/complete, retried safely), and Home shows Continue / Done.
 *
 * Swipe-back is disabled for this route (app/_layout.tsx); leaving always goes through the exit sheet.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import type { V3Workout } from '../../utils/v3Api';
import { backTarget, currentStep, nextWorkStep } from '../../utils/v3Session/engine';
import { isLoadLoggable } from '../../utils/v3Session/record';
import { stepView } from '../../utils/v3Session/viewModel';
import { overall } from '../../utils/v3Session/coach';
import { overviewModel } from '../../utils/v3Session/overview';
import { trackSession } from '../../utils/v3Session/analytics';
import { warmExerciseDemos } from '../../utils/cloudinaryVideo';
import { Image as CachedImage } from 'expo-image';
import { exerciseImageUrl } from '../../utils/v3ExerciseImages';
import { optimizedImageUrl } from '../../utils/cloudinaryImage';
import { OverviewView } from '../../components/v3/session/OverviewView';
import { ExerciseSheet } from '../../components/v3/ExerciseSheet';
import { useGuidedSession } from '../../components/v3/session/useGuidedSession';
import { CompleteScreen } from '../../components/v3/session/CompleteScreen';
import { WeightLogger } from '../../components/v3/session/WeightLogger';
import { ActionSheet, Actions, ChecklistBody, ClockBody, ExerciseScreen, FinishBody, InfoSheet, ReadyBody, TopBar } from '../../components/v3/session/SessionViews';

const HOME = '/(tabs)';

export default function V3GuidedSession() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, from } = useLocalSearchParams<{ id?: string; from?: string }>();
  const { user, token } = useAuth();
  const g = useGuidedSession(user?.id ?? null, token ?? null, id ?? null, from ?? null);
  const [exitOpen, setExitOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [detailsFor, setDetailsFor] = useState<string | null>(null);
  const [explain, setExplain] = useState<{ title: string; body: string } | null>(null);

  const goHome = useCallback(() => {
    // Pop back to Home (Build and Cart were pushed on top of it); falls back to replace if Home is not in the stack.
    try { router.dismissTo(HOME as any); } catch { router.replace(HOME as any); }
  }, [router]);

  // Android back = the exit sheet (never silently leaves a running workout)
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (g.mode.kind === 'player') { setExitOpen(true); return true; }
        return false;
      });
      return () => sub.remove();
    }, [g.mode.kind]),
  );

  // Guided reached the end on its own (a clock block's last interval, a hold that timed out, the last exercise skipped): finish
  // right away. There is no "That's the workout, tap Finish" screen; the post-workout flow is the next thing the athlete sees.
  const autoFinish = !!(
    g.mode.kind === 'player' && g.sessionMode === 'guided' && g.plan && g.state && g.state.pausedAt == null &&
    g.view.canFinish && currentStep(g.plan, g.state).type === 'finish'
  );
  useEffect(() => { if (autoFinish) g.finish(); }, [autoFinish]); // eslint-disable-line react-hooks/exhaustive-deps

  // the next exercise's photo is fetched while the athlete is still on this one, so the rest screen never waits on it
  const upcomingPhoto = (() => {
    if (!g.plan || !g.state) return null;
    const nx = nextWorkStep(g.plan, g.state);
    const it = nx && nx.itemIndex != null ? g.plan.sections[nx.section]?.items[nx.itemIndex] : null;
    const raw = it ? exerciseImageUrl(it) : null;
    return raw ? optimizedImageUrl(raw, 1080) : null;
  })();
  useEffect(() => { if (upcomingPhoto) CachedImage.prefetch(upcomingPhoto, 'memory-disk').catch(() => undefined); }, [upcomingPhoto]);
  // every exercise photo of the workout into the memory + disk cache as the session opens (the warm-up gives it time), so
  // moving from exercise to exercise, or from a set to its rest, never waits on a download
  useEffect(() => {
    const w = g.record?.envelope.workout;
    if (!w) return;
    const urls = w.blocks.flatMap((b) => b.items.map((it) => exerciseImageUrl(it))).filter((u): u is string => !!u).map((u) => optimizedImageUrl(u, 1080));
    if (urls.length) CachedImage.prefetch(urls, 'memory-disk').catch(() => undefined);
  }, [g.record?.envelope.workout?.workout_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // exercise demos: derived at the CDN before the first Watch demo (no-op for ones the Cart already warmed)
  useEffect(() => {
    const w = g.record?.envelope.workout;
    if (w) warmExerciseDemos(w.blocks.flatMap((b) => b.items.map((it) => it.exercise.media?.video_url)));
  }, [g.record?.envelope.workout?.workout_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // The details sheet shows the in-session item without Swap (in-session swap is post-launch; Cart Swap is the editing surface).
  const detailWorkout: V3Workout | null = useMemo(() => {
    const w = g.record?.envelope.workout;
    if (!w) return null;
    return { ...w, blocks: w.blocks.map((b) => ({ ...b, items: b.items.map((it) => ({ ...it, swap: null })) })) };
  }, [g.record?.envelope]);

  /* ---------------------------------------------------------------- non-player states */
  if (g.mode.kind === 'loading' || !user) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }
  if (g.mode.kind === 'error') {
    return (
      <View style={[styles.root, styles.center, { paddingHorizontal: 32 }]}>
        <Text style={styles.errorText}>{g.mode.message}</Text>
        <Pressable onPress={g.reload} style={styles.errorBtn}><Text style={styles.errorBtnText}>Try again</Text></Pressable>
        <Pressable onPress={() => router.back()} style={[styles.errorBtn, { backgroundColor: 'transparent' }]}><Text style={styles.errorBtnText}>Back</Text></Pressable>
      </View>
    );
  }
  if (g.mode.kind === 'conflict') {
    const active = g.mode.active;
    return (
      <View style={styles.root} testID="v3-session-conflict">
        <ActionSheet
          visible
          title="You have a workout in progress"
          message={`${active.title} is still going. Continue it, or end it and start this workout. Ending it doesn't count as a completed workout.`}
          bottomInset={insets.bottom}
          onClose={() => router.back()}
          options={[
            { label: 'Continue', tone: 'primary', testID: 'v3-conflict-continue', onPress: () => router.replace({ pathname: '/v3/session', params: { id: active.workoutId, from: 'conflict' } } as any) },
            { label: 'End it and start this workout', tone: 'plain', testID: 'v3-conflict-replace', onPress: () => g.endActiveAndStart() },
            { label: 'Cancel', tone: 'plain', onPress: () => router.back() },
          ]}
        />
      </View>
    );
  }
  if (g.mode.kind === 'complete' && g.record) {
    return (
      <CompleteScreen
        record={g.record}
        plan={g.plan}
        state={g.state}
        syncing={g.syncing}
        insets={insets}
        onRetry={g.retry}
        onSaveAfter={g.saveAfter}
        onShared={(via) => trackSession(token, 'v3_workout_shared', { workout_id: g.record?.workoutId, via })}
        onDone={() => goHome()}
      />
    );
  }
  if (!g.plan || !g.state || !g.record) return <View style={styles.root} />;
  // the session just reached its end on its own ("All sets done" on the last exercise, a last interval, a skip): never draw
  // the old end card for the frame before autoFinish runs. A plain screen in the celebration's colour, so the congratulations
  // screen is the first thing that appears (founder test Oct 2026: the old screen flashed first)
  if (autoFinish) {
    return <View style={styles.root} testID="v3-session-finishing" />;
  }

  /* ---------------------------------------------------------------- player */
  const plan = g.plan, state = g.state, now = g.now;
  const record = g.record;
  const curItemId = (() => { const c = plan.steps[state.cursor]; return c.itemIndex != null ? plan.sections[c.section]?.items[c.itemIndex]?.item_id : null; })();
  const prevLog = curItemId ? record.logs[curItemId]?.slice(-1)[0] : null;
  const v = stepView(plan, state, now, {
    states: record.envelope.workout?.states,
    seen: record.coachSeen,
    loggedLoad: prevLog ? `${prevLog.load} ${prevLog.unit}` : null,
    canFinish: g.view.canFinish,
    blockTypes: record.envelope.workout?.blocks.map((b) => b.type),
  });
  const st = v.step;
  const paused = state.pausedAt != null;
  const mode = g.sessionMode;
  // the EMOM switch between minutes stays on the clock screen (same ring, same round card), not the rest screen
  const emomSwitch = st.type === 'transition' && st.labels.phase === 'Switch';
  const isClock = st.type === 'timed_work' || st.type === 'recovery' || st.type === 'emom_minute' || emomSwitch;
  const isRest = (st.type === 'rest' || st.type === 'transition') && !v.transitionToWork && !emomSwitch;
  const canBack = backTarget(plan, state) != null;
  const loggable = st.type === 'work' && v.item && isLoadLoggable(plan.direction, v.item) && !st.durationSec;

  const onPrimary = () => {
    if (st.type === 'finish' || (st.type === 'checklist' && g.view.canFinish)) { g.finish(); return; }
    // the last set: one tap counts it and finishes the workout
    if (v.lastWork && v.primary === 'Finish workout') { g.finishFromLastSet(); return; }
    if ((st.type === 'work' || st.type === 'emom_minute') && st.durationSec && state.stepStartedAt == null) { g.dispatch({ type: 'start_timer' }); return; }
    if (v.transitionToWork) {
      // the next set's screen was already showing during the move: one tap ends the move and (a hold: starts it / a set: completes it)
      g.dispatch({ type: 'complete' });
      g.dispatch(v.transitionToWork.durationSec ? { type: 'start_timer' } : { type: 'complete' });
      return;
    }
    g.dispatch({ type: 'complete' });
  };

  // the exercise a rest is about: the next set's exercise, or (before a clock block) that block's first exercise
  const nextStep = isRest ? nextWorkStep(plan, state) : null;
  const restFocus = isRest ? v.focusItem ?? (nextStep ? plan.sections[nextStep.section]?.items[0] ?? null : null) : null;

  const fitted = st.type === 'work' || !!v.transitionToWork || isRest || isClock;

  const ov = overall(plan, state);

  if (mode === 'overview') {
    const model = overviewModel(plan, state, record.envelope.workout!);
    return (
      <View style={styles.root} testID="v3-session">
        <TopBar pos={v.pos} mode={mode} onMode={g.setMode} paused={paused} topInset={insets.top} onExit={() => setExitOpen(true)} overall={ov} />
        {paused ? (
          <Pressable onPress={() => g.dispatch({ type: 'resume' })} style={styles.pausedBar} testID="v3-session-resume">
            <Ionicons name="play" size={14} color={COLORS.accentInk} />
            <Text style={styles.pausedText}>Paused · tap to resume</Text>
          </Pressable>
        ) : null}
        <OverviewView
          model={model}
          bottomInset={insets.bottom}
          canFinish={g.view.canFinish || g.view.hasMainWork}
          onJump={(i) => g.dispatch({ type: 'jump', index: i })}
          onCompleteStep={(i) => g.dispatch({ type: 'complete_step', index: i })}
          onUncompleteStep={(i) => g.dispatch({ type: 'uncomplete_step', index: i })}
          onDetails={(id) => setDetailsFor(id)}
          onStartClock={(ready) => { g.dispatch({ type: 'jump', index: ready }); g.setMode('guided'); }}
          onCompleteRow={(row) => { if (row.nextOpen == null) return; g.dispatch({ type: 'jump', index: row.nextOpen }); g.dispatch({ type: 'complete_exercise' }); }}
          onFinish={() => { g.dispatch({ type: 'jump', index: plan.steps.length - 1 }); g.finish(); }}
          onEdge={(edge, done) => { g.dispatch({ type: 'jump', index: edge.step }); if (done) g.dispatch({ type: 'complete' }); }}
        />
        <ActionSheet
          visible={exitOpen}
          title="Leave the workout?"
          message="Pause and leave keeps your place. Continue from Home any time today."
          bottomInset={insets.bottom}
          onClose={() => setExitOpen(false)}
          options={[
            { label: 'Keep going', tone: 'primary', testID: 'v3-exit-keep', onPress: () => setExitOpen(false) },
            { label: 'Pause and leave', tone: 'plain', testID: 'v3-exit-pause', onPress: async () => { setExitOpen(false); await g.pauseAndLeave(); goHome(); } },
            { label: 'End workout', tone: 'danger', testID: 'v3-exit-end', onPress: () => { setExitOpen(false); setConfirmEnd(true); } },
          ]}
        />
        <ActionSheet
          visible={confirmEnd}
          title="End this workout?"
          message="It won't count as a completed workout. Your plan stays in the Cart if you want to start it again."
          bottomInset={insets.bottom}
          onClose={() => setConfirmEnd(false)}
          options={[
            { label: 'End workout', tone: 'danger', testID: 'v3-end-confirm', onPress: async () => { setConfirmEnd(false); await g.endWorkout(); goHome(); } },
            { label: 'Keep going', tone: 'plain', onPress: () => setConfirmEnd(false) },
          ]}
        />
        <ExerciseSheet workout={detailWorkout} itemId={detailsFor} swapping={false} onSwap={() => undefined} onClose={() => setDetailsFor(null)} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} testID="v3-session">
      {/* the exercise and clock screens are one fitted column (header · uncropped photo · the set): the photo takes the height
          that is left, so nothing scrolls; warm-up, Ready and Finish scroll under a floating bar */}
      <TopBar pos={v.pos} mode={mode} onMode={g.setMode} paused={paused} topInset={insets.top} onExit={() => setExitOpen(true)} overlay />

      <BodyFrame fitted={fitted}>
        {st.type === 'work' || v.transitionToWork || isRest ? (
          // one component for the set and its rest: the hero stays, only the guidance flips (no flash on Complete set)
          <ExerciseScreen
            v={v}
            plan={plan}
            stage={st.type === 'work' || v.transitionToWork ? 'work' : 'rest'}
            focus={st.type === 'work' || v.transitionToWork ? (v.transitionToWork ? v.focusItem ?? v.item : v.item) : restFocus}
            topInset={insets.top}
            onDetails={() => { const f = st.type === 'work' ? v.item : v.transitionToWork ? v.focusItem ?? v.item : restFocus; if (f) setDetailsFor(f.item_id); }}
            onExplain={(title, body) => setExplain({ title, body })}
            onAddTime={(sec) => g.dispatch({ type: 'add_time', seconds: sec })}
            logger={
              loggable && !v.transitionToWork ? (
                <WeightLogger
                  item={v.item!}
                  step={st}
                  logs={g.record.logs[v.item!.item_id]}
                  unit={g.unit}
                  onUnit={g.setUnit}
                  onSave={(log) => g.saveLog(v.item!.item_id, log)}
                  onClear={(set) => g.clearLog(v.item!.item_id, set)}
                />
              ) : null
            }
          />
        ) : isClock ? (
          <ClockBody v={v} plan={plan} topInset={insets.top} paused={paused} onPause={() => g.dispatch({ type: 'pause' })} onResume={() => g.dispatch({ type: 'resume' })} onAddTime={(sec) => g.dispatch({ type: 'add_time', seconds: sec })} onDetails={() => (v.item ?? v.upNext?.item) && setDetailsFor((v.item ?? v.upNext!.item)!.item_id)} />
        ) : st.type === 'ready' ? (
          <ReadyBody v={v} plan={plan} topInset={insets.top} onDetails={() => v.section.items[0] && setDetailsFor(v.section.items[0].item_id)} />
        ) : st.type === 'checklist' ? (
          <ChecklistBody key={st.id} v={v} plan={plan} topInset={insets.top} onDetails={(it) => setDetailsFor(it.item_id)} />
        ) : (
          <FinishBody canFinish={g.view.canFinish} topInset={insets.top} />
        )}
      </BodyFrame>

      <Actions
        v={v}
        paused={paused}
        canFinish={g.view.canFinish}
        bottomInset={insets.bottom}
        onPrimary={onPrimary}
        onSkip={() => g.dispatch({ type: 'skip' })}
        // no confirmation (founder review 6c): a straight-set exercise finishes its sets, a superset / circuit the whole group
        onAllSets={v.allDone ? () => g.dispatch({ type: v.allDone!.scope === 'block' ? 'complete_block' : 'complete_exercise' }) : null}
        onAddTime={(s) => g.dispatch({ type: 'add_time', seconds: s })}
        onBack={canBack ? () => g.dispatch({ type: 'back' }) : null}
        onMore={() => setMoreOpen(true)}
        onPause={() => g.dispatch({ type: 'pause' })}
        onResume={() => g.dispatch({ type: 'resume' })}
        onEnd={() => setConfirmEnd(true)}
      />

      {/* More: skips and details (not the main path) */}
      <ActionSheet
        visible={moreOpen}
        title={v.item?.exercise.name ?? v.section.title}
        bottomInset={insets.bottom}
        onClose={() => setMoreOpen(false)}
        options={[
          ...(v.item ? [{ label: 'Exercise details', tone: 'plain' as const, onPress: () => { setMoreOpen(false); setDetailsFor(v.item!.item_id); } }] : []),
          ...(isRest ? [{ label: 'Skip rest', tone: 'plain' as const, onPress: () => { setMoreOpen(false); g.dispatch({ type: 'skip' }); } }] : []),
          ...(st.type === 'work' ? [{ label: 'Skip this set', tone: 'plain' as const, testID: 'v3-more-skip-set', onPress: () => { setMoreOpen(false); g.dispatch({ type: 'skip' }); } }] : []),
          ...(st.itemIndex != null && v.section.kind === 'block' ? [{ label: 'Skip this exercise', tone: 'plain' as const, testID: 'v3-more-skip-exercise', onPress: () => { setMoreOpen(false); g.dispatch({ type: 'skip_exercise' }); } }] : []),
          ...(v.section.kind === 'block' ? [{ label: 'Skip this block', tone: 'plain' as const, testID: 'v3-more-skip-block', onPress: () => { setMoreOpen(false); g.dispatch({ type: 'skip_block' }); } }] : []),
          ...(st.type === 'checklist' ? [{ label: v.section.kind === 'warmup' ? 'Skip warm-up' : 'Skip cool-down', tone: 'plain' as const, onPress: () => { setMoreOpen(false); g.dispatch({ type: 'skip' }); } }] : []),
          { label: 'Cancel', tone: 'plain' as const, onPress: () => setMoreOpen(false) },
        ]}
      />

      {/* Exit: Pause and leave · End workout · Keep going */}
      <ActionSheet
        visible={exitOpen}
        title="Leave the workout?"
        message="Pause and leave keeps your place. Continue from Home any time today."
        bottomInset={insets.bottom}
        onClose={() => setExitOpen(false)}
        options={[
          { label: 'Keep going', tone: 'primary', testID: 'v3-exit-keep', onPress: () => setExitOpen(false) },
          { label: 'Pause and leave', tone: 'plain', testID: 'v3-exit-pause', onPress: async () => { setExitOpen(false); await g.pauseAndLeave(); goHome(); } },
          { label: 'End workout', tone: 'danger', testID: 'v3-exit-end', onPress: () => { setExitOpen(false); setConfirmEnd(true); } },
        ]}
      />
      <ActionSheet
        visible={confirmEnd}
        title="End this workout?"
        message="It won't count as a completed workout. Your plan stays in the Cart if you want to start it again."
        bottomInset={insets.bottom}
        onClose={() => setConfirmEnd(false)}
        options={[
          { label: 'End workout', tone: 'danger', testID: 'v3-end-confirm', onPress: async () => { setConfirmEnd(false); await g.endWorkout(); goHome(); } },
          { label: 'Keep going', tone: 'plain', onPress: () => setConfirmEnd(false) },
        ]}
      />

      <InfoSheet visible={!!explain} title={explain?.title ?? ''} body={explain?.body ?? ''} onClose={() => setExplain(null)} bottomInset={insets.bottom} />
      <ExerciseSheet workout={detailWorkout} itemId={detailsFor} swapping={false} onSwap={() => undefined} onClose={() => setDetailsFor(null)} />
    </KeyboardAvoidingView>
  );
}

/** A fitted column (no scroll) for the exercise / clock screens, a ScrollView for the rest. */
function BodyFrame({ fitted, children }: { fitted: boolean; children: React.ReactNode }) {
  if (fitted) return <View style={{ flex: 1 }}>{children}</View>;
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  body: { paddingBottom: 24 },
  pausedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 18, marginTop: 6, height: 36, borderRadius: 12, backgroundColor: COLORS.accent },
  pausedText: { fontSize: 13, fontWeight: '800', color: COLORS.accentInk },
  errorText: { fontSize: 15, lineHeight: 22, color: COLORS.textSecondary, textAlign: 'center' },
  errorBtn: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)' },
  errorBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
});
