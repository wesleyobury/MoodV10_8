/**
 * useGuidedSession: the React side of the V3 Guided Session. Owns the session record, runs the pure engine, persists on
 * every transition, and wires the platform: AppState (background notice + catch-up), keep-awake, haptics, analytics,
 * completion delivery. The screen only renders what this returns.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { V3AfterBody, V3Envelope, afterV3Workout, completeV3Workout, getV3Workout, localDateISO } from '../../../utils/v3Api';
import { readCachedEnvelope } from '../../../utils/v3Today';
import { SessionAction, SessionState, canFinish, currentStep, finishFromLast, finishState, hasMainWork, reduce, resolve, stepEndAt, tally } from '../../../utils/v3Session/engine';
import {
  AfterIntent, SessionMode, SessionRecord, SetLog, WeightUnit, afterPayload, buildCompletion, endEarly, newRecord, newSessionId, removeLog, restore, shouldSendAfter, timerNotice, upsertLog, withAfter, withState,
} from '../../../utils/v3Session/record';
import { readPreferredMode, readSession, readWeightUnit, updateSession, writePreferredMode, writeSession, writeWeightUnit } from '../../../utils/v3Session/store';
import { structureKey } from '../../../utils/v3Session/coach';
import { syncCompletion } from '../../../utils/v3Session/sync';
import { timerNotifier } from '../../../utils/v3Session/notify';
import { trackSession } from '../../../utils/v3Session/analytics';
import { START_BLOCKED_MESSAGE } from '../../../utils/v3Session/access';
import { useV3StartGate } from '../../../utils/v3Session/startGate';
import { clearFirstWorkoutPending } from '../../../utils/v3Profile';
import type { SessionPlan, SessionStep } from '../../../utils/v3Session/types';

const KEEP_AWAKE_TAG = 'mood-v3-guided-session';
const TICK_MS = 250;

export type ScreenMode =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'conflict'; active: SessionRecord; pending: string }
  | { kind: 'player' }
  | { kind: 'complete' };

export function syncDeps() {
  return { update: updateSession, send: completeV3Workout, now: () => Date.now() };
}

export function useGuidedSession(uid: string | null, token: string | null, workoutId: string | null, from: string | null) {
  const [mode, setMode] = useState<ScreenMode>({ kind: 'loading' });
  const [record, setRecord] = useState<SessionRecord | null>(null);
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [state, setState] = useState<SessionState | null>(null);
  const [now, setNow] = useState(Date.now());
  const [unit, setUnitState] = useState<WeightUnit>('lb');
  const [syncing, setSyncing] = useState(false);
  const startGate = useV3StartGate();

  const rec = useRef<SessionRecord | null>(null);
  const planRef = useRef<SessionPlan | null>(null);
  const stRef = useRef<SessionState | null>(null);
  const blockEnteredAt = useRef<number>(Date.now());
  const blockCounters = useRef({ restsSkipped: 0, timeAdded: 0 });
  const lastBuzzSecond = useRef<string>('');
  rec.current = record;
  planRef.current = plan;
  stRef.current = state;

  /* ------------------------------------------------------------------ persistence + transitions */

  const persist = useCallback(
    (r: SessionRecord) => {
      rec.current = r;
      setRecord(r);
      if (uid) writeSession(uid, r);
    },
    [uid],
  );

  /** Apply a new engine state: haptics for timer-driven transitions, block analytics, then persist. */
  const commit = useCallback(
    (next: SessionState, cause: 'user' | 'timer', t: number) => {
      const p = planRef.current, prev = stRef.current, r = rec.current;
      if (!p || !prev || !r) return;
      if (next === prev) return;
      const a = currentStep(p, prev), b = currentStep(p, next);
      if (a.index !== b.index && cause === 'timer') buzzForTransition(a, b);
      // a structure explanation is shown once: leaving the step it was shown on marks it seen
      let seen = r.coachSeen;
      if (a.index !== b.index) {
        const k = structureKey(p.sections[a.section], p.direction);
        if (k && !seen.includes(k) && (a.type === 'ready' || a.countsAsWork)) seen = [...seen, k];
      }
      if (a.section !== b.section && p.sections[a.section]?.kind === 'block') {
        const sec = p.sections[a.section];
        const steps = p.steps.filter((x) => x.section === sec.index && x.countsAsWork);
        trackSession(token, 'v3_block_completed', {
          workout_id: r.workoutId, session_id: r.sessionId, block: sec.blockNumber, structure: sec.structure, rest_kind: sec.restKind,
          actual_sec: Math.round((t - blockEnteredAt.current) / 1000), work_done: steps.filter((x) => next.status[x.id] === 'done').length,
          work_skipped: steps.filter((x) => next.status[x.id] === 'skipped').length, work_total: steps.length,
          rests_skipped: blockCounters.current.restsSkipped, time_added_sec: blockCounters.current.timeAdded,
        });
        blockEnteredAt.current = t;
        blockCounters.current = { restsSkipped: 0, timeAdded: 0 };
      }
      stRef.current = next;
      setState(next);
      persist(withState(seen === r.coachSeen ? r : { ...r, coachSeen: seen }, p, next, t));
    },
    [persist, token],
  );

  const dispatch = useCallback(
    (action: SessionAction) => {
      const p = planRef.current, s = stRef.current, r = rec.current;
      if (!p || !s || !r || r.status !== 'active') return;
      const t = Date.now();
      const cur = currentStep(p, resolve(p, s, t));
      if (action.type === 'skip' && (cur.type === 'rest' || cur.type === 'recovery' || cur.type === 'transition')) blockCounters.current.restsSkipped++;
      if (action.type === 'complete' && (cur.type === 'rest' || cur.type === 'transition')) blockCounters.current.restsSkipped++;
      if (action.type === 'add_time') blockCounters.current.timeAdded += action.seconds;
      if (action.type === 'jump') trackSession(token, 'v3_overview_jump', { workout_id: r.workoutId, session_id: r.sessionId, from: cur.index, to: action.index });
      if (action.type === 'skip_exercise' || action.type === 'skip_block') {
        trackSession(token, 'v3_step_skipped', { workout_id: r.workoutId, session_id: r.sessionId, scope: action.type === 'skip_block' ? 'block' : 'exercise', block: p.sections[cur.section]?.blockNumber, exercise: p.sections[cur.section]?.items[cur.itemIndex ?? -1]?.exercise.id ?? null });
      }
      const next = reduce(p, s, action, t);
      setNow(t);
      commit(next, 'user', t);
      if (action.type === 'pause') deactivateKeepAwake(KEEP_AWAKE_TAG);
      if (action.type === 'resume') activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    },
    [commit, token],
  );

  /* ------------------------------------------------------------------ start / restore */

  const startFresh = useCallback(
    async (env: V3Envelope) => {
      if (!uid) return;
      // A FRESH session is a start (resume / relaunch never reaches here). The Cart already gated this workout, so this
      // is normally a cached grant; it matters for starts that skip the Cart (Replace on the conflict sheet, deep links).
      if (!(await startGate(env.workout!.workout_id!))) { setMode({ kind: 'error', message: START_BLOCKED_MESSAGE }); return; }
      const t = Date.now();
      const preferred = uid ? await readPreferredMode(uid) : 'guided';
      const { record: r, plan: p, state: s } = newRecord(env, t, localDateISO(), newSessionId(t), preferred);
      planRef.current = p; stRef.current = s; blockEnteredAt.current = t;
      setPlan(p); setState(s); persist(r); setNow(t);
      setMode({ kind: 'player' });
      const w = env.workout!;
      trackSession(token, 'v3_workout_started', {
        workout_id: r.workoutId, session_id: r.sessionId, direction: w.direction, archetype: w.archetype?.id, version: w.version, mode: preferred,
        estimated_minutes: w.duration?.estimated_minutes, work_steps: p.workSteps, blocks: w.blocks.length,
      });
      trackSession(token, 'workout_started', { source: 'v3', v3_workout_id: r.workoutId, direction: w.direction, difficulty: w.experience, workout_name: w.archetype?.name });
    },
    [uid, token, persist, startGate],
  );

  const resume = useCallback(
    (r: SessionRecord, how: string) => {
      const t = Date.now();
      const { plan: p, state: s, exact } = restore(r, t);
      planRef.current = p; stRef.current = s; blockEnteredAt.current = t;
      setPlan(p); setState(s); setNow(t);
      persist(withState(r, p, s, t));
      setMode({ kind: r.status === 'active' ? 'player' : 'complete' });
      if (r.status === 'active') trackSession(token, 'v3_session_resumed', { workout_id: r.workoutId, session_id: r.sessionId, from: how, gap_sec: Math.round((t - r.lastActiveAt) / 1000), exact });
    },
    [persist, token],
  );

  const load = useCallback(async () => {
    if (!uid || !workoutId) return;
    setMode({ kind: 'loading' });
    const [{ record: stored, expiredNow }, u] = await Promise.all([readSession(uid), readWeightUnit(uid)]);
    setUnitState(u);
    if (expiredNow && stored) trackSession(token, 'v3_workout_abandoned', { workout_id: stored.workoutId, session_id: stored.sessionId, reason: 'expired' });
    if (stored && stored.workoutId === workoutId && (stored.status === 'active' || stored.status === 'completing' || stored.status === 'completed')) {
      resume(stored, from === 'home' ? 'home' : 'relaunch');
      return;
    }
    if (stored && stored.status === 'active' && stored.workoutId !== workoutId) {
      setMode({ kind: 'conflict', active: stored, pending: workoutId });
      return;
    }
    let env = await readCachedEnvelope(uid, workoutId);
    if (!env?.workout && token) {
      const res = await getV3Workout(token, workoutId);
      if (res.ok) env = res.envelope;
    }
    if (!env?.workout) {
      setMode({ kind: 'error', message: "Couldn't load this workout. Check your connection and try again." });
      return;
    }
    await startFresh(env);
  }, [uid, workoutId, token, from, resume, startFresh]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, workoutId]);

  // Workout #1 done: the onboarding activation window closes, so deferred prompts (wearables, founding offer) may show
  // once the athlete is back Home (utils/v3Profile isFirstWorkoutPending).
  useEffect(() => {
    if (mode.kind === 'complete' && uid) clearFirstWorkoutPending(uid);
  }, [mode.kind, uid]);

  /** Conflict sheet: end the other session (not completed, nothing recorded), then start this one. */
  const endActiveAndStart = useCallback(async () => {
    if (mode.kind !== 'conflict' || !uid) return;
    const t = Date.now();
    const ended = endEarly(mode.active, t, 'replaced');
    await writeSession(uid, ended);
    const p = restore(mode.active, t);
    const tl = tally(p.plan, p.state);
    trackSession(token, 'v3_workout_ended_early', { workout_id: ended.workoutId, session_id: ended.sessionId, reason: 'replaced', work_done: tl.workDone, work_total: tl.workTotal });
    await timerNotifier.cancel();
    rec.current = null;
    await load();
  }, [mode, uid, token, load]);

  /* ------------------------------------------------------------------ clock: render tick + foreground timer expiry */

  const cur = plan && state ? currentStep(plan, state) : null;
  const needsTick = mode.kind === 'player' && !!state && state.pausedAt == null && (state.stepStartedAt != null || cur?.type === 'work');
  useEffect(() => {
    if (!needsTick) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const p = planRef.current, s = stRef.current;
      if (!p || !s) return;
      const end = stepEndAt(p, s);
      if (end != null) {
        const leftS = Math.ceil((end - t) / 1000);
        const st = currentStep(p, s);
        if (leftS >= 1 && leftS <= 3 && (st.durationSec ?? 0) >= 10 && st.type !== 'work') {
          const key = `${st.id}:${leftS}`;
          if (lastBuzzSecond.current !== key) { lastBuzzSecond.current = key; Haptics.selectionAsync().catch(() => undefined); }
        }
        if (t >= end) commit(resolve(p, s, t), 'timer', t);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [needsTick, commit]);

  /* ------------------------------------------------------------------ keep awake */

  const awake = mode.kind === 'player' && !!state && state.pausedAt == null && record?.status === 'active';
  useEffect(() => {
    if (!awake) { deactivateKeepAwake(KEEP_AWAKE_TAG); return; }
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    return () => { deactivateKeepAwake(KEEP_AWAKE_TAG); };
  }, [awake]);

  /* ------------------------------------------------------------------ app background / foreground */

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const p = planRef.current, s = stRef.current, r = rec.current;
      if (next === 'background' || next === 'inactive') {
        if (p && s && r && r.status === 'active') {
          const t = Date.now();
          persist(withState(r, p, s, t));
          // Overview is self-paced: no rest alerts there. A clock block still gets its block-end notice in either mode.
          const st = currentStep(p, s);
          if (next === 'background' && (r.mode === 'guided' || p.sections[st.section]?.clock)) timerNotifier.schedule(timerNotice(p, s, t), r.workoutId, t);
        }
        return;
      }
      if (next === 'active') {
        timerNotifier.cancel();
        const t = Date.now();
        if (p && s && r && r.status === 'active') commit(resolve(p, s, t), 'user', t);
        setNow(t);
        if (uid && token && r && r.status === 'completing') runSync('foreground');
        if (uid && token && r && r.status === 'completed') sendAfter('foreground');
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persist, commit, uid, token]);

  // leaving the player (unmount): nothing keeps running; the record is already saved
  useEffect(() => () => { deactivateKeepAwake(KEEP_AWAKE_TAG); timerNotifier.cancel(); }, []);

  /* ------------------------------------------------------------------ session mode (Guided | Overview) */

  /** Switching views never touches the engine state: same cursor, timers, logs and completion eligibility. */
  const setSessionMode = useCallback((m: SessionMode) => {
    const r = rec.current;
    if (!r || r.mode === m) return;
    persist({ ...r, mode: m });
    if (uid) writePreferredMode(uid, m);
    trackSession(token, 'v3_session_mode', { workout_id: r.workoutId, session_id: r.sessionId, mode: m });
  }, [persist, uid, token]);

  /* ------------------------------------------------------------------ weight logging (F2) */

  const setUnit = useCallback((u: WeightUnit) => {
    setUnitState(u);
    if (uid) writeWeightUnit(uid, u);
  }, [uid]);

  const saveLog = useCallback((itemId: string, log: SetLog) => {
    const r = rec.current;
    if (!r || r.status !== 'active') return;
    persist(upsertLog(r, itemId, log));
  }, [persist]);

  const clearLog = useCallback((itemId: string, set: number) => {
    const r = rec.current;
    if (!r || r.status !== 'active') return;
    persist(removeLog(r, itemId, set));
  }, [persist]);

  /* ------------------------------------------------------------------ finish / end */

  const runSync = useCallback(async (trigger: 'timer' | 'foreground' | 'home' | 'screen') => {
    if (!uid || !token) return;
    setSyncing(true);
    const out = await syncCompletion(uid, token, trigger, syncDeps());
    setSyncing(false);
    if (out.kind === 'synced') { rec.current = out.record; setRecord(out.record); }
    else if (out.kind === 'failed') {
      if (out.record) { rec.current = out.record; setRecord(out.record); }
      trackSession(token, 'v3_completion_failed', { workout_id: out.record?.workoutId, retryable: out.retryable, attempts: out.record?.completion?.attempts, error: out.record?.completion?.lastError });
    }
  }, [uid, token]);

  /** Explicit Finish (F5): only at the end, only with at least one main set done. Persist the intent, then send. */
  const finishWith = useCallback(async (close: (p: SessionPlan, s0: SessionState, t: number) => SessionState | null) => {
    const p = planRef.current, s0 = stRef.current, r = rec.current;
    if (!p || !s0 || !r || r.status !== 'active') return;
    const t = Date.now();
    const s = close(p, s0, t);
    if (!s) return;
    stRef.current = s;
    setState(s);
    const completion = buildCompletion(r, p, s, t, localDateISO());
    const next: SessionRecord = { ...withState(r, p, s, t), status: 'completing', completion, endedAt: t };
    rec.current = next;
    setRecord(next);
    // switch to the complete screen in the same render as the finished state: waiting for the writes below let the player
    // redraw its old end card for a moment (the flash before the congratulations screen, founder test Oct 2026)
    setMode({ kind: 'complete' });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    if (uid) await writeSession(uid, next);
    await timerNotifier.cancel();
    deactivateKeepAwake(KEEP_AWAKE_TAG);
    const tl = tally(p, s);
    trackSession(token, 'v3_workout_completed', {
      workout_id: r.workoutId, session_id: r.sessionId, direction: r.direction, elapsed_min: completion.payload.duration_actual,
      work_done: tl.workDone, work_skipped: tl.workSkipped, work_total: tl.workTotal, logged_items: completion.payload.performance.length,
    });
    runSync('screen');
  }, [uid, token, runSync]);

  /** Finish from the end (Finish card, cool-down, Overview): F5 as before. */
  const finish = useCallback(() => finishWith((p, s0, t) => (canFinish(p, s0) ? finishState(p, s0, t) : null)), [finishWith]);

  /** Finish from the last set (founder review 6): that set counts, what is left after it closes as skipped, then F5. */
  const finishFromLastSet = useCallback(
    () => finishWith((p, s0, t) => { const s = finishFromLast(p, s0, t); return canFinish(p, s) ? s : null; }),
    [finishWith],
  );

  /** End workout (exit sheet): not completed, nothing recorded server-side, no allowance, no streak. */
  const endWorkout = useCallback(async () => {
    const p = planRef.current, s = stRef.current, r = rec.current;
    if (!r || r.status !== 'active') return;
    const t = Date.now();
    const ended = endEarly(p && s ? withState(r, p, s, t) : r, t);
    rec.current = ended;
    setRecord(ended);
    if (uid) await writeSession(uid, ended);
    await timerNotifier.cancel();
    deactivateKeepAwake(KEEP_AWAKE_TAG);
    const tl = p && s ? tally(p, s) : null;
    trackSession(token, 'v3_workout_ended_early', {
      workout_id: r.workoutId, session_id: r.sessionId, reason: 'user', block: p && s ? p.sections[currentStep(p, s).section]?.blockNumber : null,
      work_done: tl?.workDone, work_total: tl?.workTotal, elapsed_min: Math.round((t - r.startedAt - (s?.pausedMs ?? 0)) / 60000),
    });
  }, [uid, token]);

  /** Pause and leave: resumable from Home (Continue Workout). */
  const pauseAndLeave = useCallback(async () => {
    const p = planRef.current, s = stRef.current, r = rec.current;
    if (!p || !s || !r || r.status !== 'active') return;
    const t = Date.now();
    const paused = reduce(p, s, { type: 'pause' }, t);
    stRef.current = paused;
    setState(paused);
    const next = withState(r, p, paused, t);
    rec.current = next;
    setRecord(next);
    if (uid) await writeSession(uid, next);
    await timerNotifier.cancel();
    deactivateKeepAwake(KEEP_AWAKE_TAG);
  }, [uid]);

  /* ------------------------------------------------------------------ post-workout additions (feedback, real metrics) */

  const sendAfter = useCallback(async (trigger: 'timer' | 'foreground' | 'home' | 'screen') => {
    if (!uid || !token) return;
    const r = rec.current;
    if (!shouldSendAfter(r, Date.now(), trigger)) return;
    const body = afterPayload(r!.after!) as V3AfterBody;
    const res = await afterV3Workout(token, r!.workoutId, body);
    const saved = await updateSession(uid, (cur) => {
      if (!cur || !cur.after || cur.sessionId !== r!.sessionId) return cur;
      const t = Date.now();
      if (res.ok) return { ...cur, after: { ...cur.after, dirty: JSON.stringify(afterPayload(cur.after)) !== JSON.stringify(body), attempts: cur.after.attempts + 1, syncedAt: t } };
      const attempts = cur.after.attempts + 1;
      return { ...cur, after: { ...cur.after, attempts, nextAttemptAt: t + Math.min(3_600_000, 30_000 * 2 ** Math.min(attempts, 7)), dirty: res.retryable ? true : false } };
    });
    if (saved) { rec.current = saved; setRecord(saved); }
  }, [uid, token]);

  /** Feedback / metrics from the post-workout flow. Persisted first, sent with retry; the record is the source of truth. */
  const saveAfter = useCallback((patch: Partial<AfterIntent>) => {
    const r = rec.current;
    if (!r || (r.status !== 'completing' && r.status !== 'completed')) return;
    const next = withAfter(r, patch, Date.now());
    rec.current = next;
    setRecord(next);
    if (uid) writeSession(uid, next).then(() => sendAfter('screen'));
  }, [uid, sendAfter]);

  // after the completion itself is acknowledged, flush any pending additions
  useEffect(() => {
    if (record?.status === 'completed' && record.after?.dirty) sendAfter('screen');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record?.status]);

  // completion screen: controlled backoff while it is open
  useEffect(() => {
    if (mode.kind !== 'complete' || record?.status !== 'completing' || !record.completion || record.completion.terminal) return;
    const wait = Math.max(1000, record.completion.nextAttemptAt - Date.now());
    const id = setTimeout(() => runSync('timer'), wait);
    return () => clearTimeout(id);
  }, [mode.kind, record?.status, record?.completion?.nextAttemptAt, record?.completion?.terminal, runSync]);

  const view = useMemo(() => ({ canFinish: plan && state ? canFinish(plan, state) : false, hasMainWork: plan && state ? hasMainWork(plan, state) : false }), [plan, state]);

  return {
    mode, record, plan, state, now, unit, syncing, view,
    sessionMode: (record?.mode ?? 'guided') as SessionMode, setMode: setSessionMode,
    dispatch, finish, finishFromLastSet, endWorkout, pauseAndLeave, endActiveAndStart, setUnit, saveLog, clearLog, saveAfter, retry: () => runSync('screen'), reload: load,
  };
}

/** Restrained haptics: only when the clock moves the athlete on, never on ordinary taps. */
function buzzForTransition(a: SessionStep, b: SessionStep) {
  const run = (p: Promise<void>) => p.catch(() => undefined);
  if (a.type === 'rest' || a.type === 'transition' || (a.type === 'recovery' && b.type === 'timed_work')) {
    run(b.type === 'timed_work' && b.round != null && b.round !== a.round ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy) : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  } else if (a.type === 'timed_work' || a.type === 'emom_minute') {
    run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  } else if (a.type === 'work' && a.durationSec) {
    run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  }
}
