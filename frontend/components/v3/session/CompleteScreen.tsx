/**
 * Post-workout flow (founder pass, Oct 2026): ONE screen.
 *
 *   Done header   congratulations, what you did (minutes · sets · exercises), streak, saved state (the "How did that feel?"
 *                 question was removed: nothing used the answer yet; AfterIntent.fit_rating stays in the record type so it
 *                 can come back when the engines act on it)
 *   Share         your numbers (tap any number to type it; Sync from Health when a wearable is there), the overlay picker
 *                 (Rings · Simple · Heart rate), the card sized to fit, Instagram Story / Share, Done.
 *
 * The last set's Finish workout lands here directly (no "That's the workout" card, no separate Workout complete page).
 * Real data only: minutes from the session clock, sets from the plan, streak from the server, calories and heart rate only
 * from the wearable or the athlete's own entry. Feedback and metrics go to POST /api/v3/workouts/{id}/after through the
 * session record (persisted first, retried; see useGuidedSession.saveAfter).
 *
 * Founder pass 3 (Oct 2026): the finish is its own moment. A full-screen congratulations beat (CelebrationIntro.tsx:
 * ring draw, medal landing with heavy + success haptics, shockwaves, slow gold confetti and dust, count-up numbers,
 * Continue) covers this screen first; Continue lifts it away and the card's rings sweep in. The rings are calories ·
 * minutes · intensity, each filling toward a goal (utils/v3Session/ringGoals: the chosen length, a calories target for the
 * Direction, intensity out of 100). When Health is connected the numbers fill themselves (autoSync): right away, again at
 * 15s and 55s (a Watch writes its workout to Health a few seconds after it ends) and when the app comes back to the
 * front; anything the athlete typed is never overwritten by the automatic pass. Instagram Story is the primary action.
 *
 * Monetization extension point (utils/v3Session/access.ts): postCompletionAction() decides whether a paywall overlays the
 * flow after "Saved to MOOD" ('overlay_after_saved') or runs on Done ('on_done'). Launch placement is 'none'.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Animated, AppState, Easing, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../../SafeLinearGradient';
import { COLORS } from '../../../constants/brand';
import type { AfterIntent, SessionRecord } from '../../../utils/v3Session/record';
import type { SessionPlan } from '../../../utils/v3Session/types';
import { SessionState, tally } from '../../../utils/v3Session/engine';
import { postCompletionAction } from '../../../utils/v3Session/access';
import { cartScan } from '../../../utils/v3CartFormat';
import { afterFromWearable, syncWearable, wearableAuthorized, wearableAvailable, WearableNumbers } from '../../../utils/v3Session/wearable';
import { caloriesGoal, minutesGoal, sessionIntensity } from '../../../utils/v3Session/ringGoals';
import { CelebrationIntro } from './CelebrationIntro';
import { GoalsSheet } from './GoalsSheet';
import { InstagramTip, loadIgTipOff, saveIgTipOff } from './InstagramTip';
import { loadRingGoals, resolveRingGoals, RingGoalPrefs, saveRingGoals } from '../../../utils/v3Session/goalStore';
import { shareCard } from '../../../utils/v3Session/share';
import { SHARE_TREATMENTS, ShareCard, ShareData, ShareTreatment } from './ShareCard';
import { useHealth } from '../../../contexts/HealthContext';
import { setHealthOnboardingComplete } from '../../../utils/healthStorage';

const HEALTH_NAME = Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect';

interface Props {
  record: SessionRecord;
  plan: SessionPlan | null;
  state: SessionState | null;
  syncing: boolean;
  insets: { top: number; bottom: number };
  onRetry: () => void;
  onSaveAfter: (patch: Partial<AfterIntent>) => void;
  onDone: (paywall: 'none' | 'on_done') => void;
  onShared?: (via: string) => void;
}

export function CompleteScreen({ record, plan, state, syncing, insets, onRetry, onSaveAfter, onDone, onShared }: Props) {
  const c = record.completion;
  const t = plan && state ? tally(plan, state) : null;
  const w = record.envelope.workout!;
  const minutes = record.after?.duration_actual ?? c?.payload.duration_actual ?? null;
  const synced = record.status === 'completed';
  const action = postCompletionAction(synced ? c?.access ?? null : null);

  const data: ShareData = useMemo(() => {
    const blocks = cartScan(w).map((b) => ({ label: b.label, lines: b.rows.map((r) => `${r.name} · ${r.rx}`) }));
    return {
      title: w.archetype?.name ?? w.direction_name,
      direction: w.direction_name,
      dateLabel: new Date(record.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase(),
      minutes,
      sets: t?.setsDone ?? null,
      intervals: t?.boutsDone ?? null,
      calories: record.after?.calories ?? null,
      avgHr: record.after?.avg_heart_rate ?? null,
      maxHr: record.after?.max_heart_rate ?? null,
      steps: record.after?.steps ?? null,
      hrv: record.after?.hrv_sdnn ?? null,
      hrFromWearable: record.after?.source === 'wearable',
      streak: c?.streak?.current ?? null,
      exercises: w.blocks.flatMap((b) => b.items.map((it) => it.exercise.name)),
      blocks,
      seed: record.sessionId,
      minutesGoal: minutesGoal(w.duration?.requested_minutes),
      caloriesGoal: caloriesGoal(w.direction, minutesGoal(w.duration?.requested_minutes)),
    };
  }, [w, record.startedAt, record.after, record.sessionId, minutes, t?.setsDone, t?.boutsDone, c?.streak?.current]);

  const done = () => onDone(action === 'on_done' ? 'on_done' : 'none');
  const [celebrating, setCelebrating] = useState(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]} testID="v3-session-complete">
      <Share
        data={data}
        record={record}
        insets={insets}
        onSaveAfter={onSaveAfter}
        onDone={done}
        onShared={onShared}
        work={t ? { done: t.workDone, total: t.workTotal } : null}
        autoSync
        revealed={!celebrating}
        status={<SyncStatus record={record} syncing={syncing} synced={synced} onRetry={onRetry} />}
      />
      {celebrating ? (
        <CelebrationIntro
          stats={{ title: data.title, minutes: data.minutes, sets: data.sets, intervals: data.intervals, exercises: data.exercises.length, streak: data.streak }}
          insets={insets}
          onContinue={() => setCelebrating(false)}
        />
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ 1. the done header (top of the one screen) */

/** Saved / syncing state, one quiet line above Done (the old "Workout complete." header was removed, founder test Oct 2026:
 *  the celebration screen says it; this screen is for the numbers and the share). */
function SyncStatus(p: { record: SessionRecord; syncing: boolean; synced: boolean; onRetry: () => void }) {
  const c = p.record.completion;
  return (
    <View style={styles.sync} testID="v3-session-sync">
      {p.synced ? (
        <><Ionicons name="checkmark-circle" size={13} color={COLORS.accent} /><Text style={styles.syncText}>Saved to MOOD</Text></>
      ) : p.syncing && !c?.attempts ? (
        <><ActivityIndicator size="small" color={COLORS.textSecondary} /><Text style={styles.syncText}>Saving…</Text></>
      ) : c?.terminal ? (
        <Text style={styles.syncText} numberOfLines={1}>Saved on this phone.</Text>
      ) : (
        <Pressable onPress={p.onRetry} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }} hitSlop={8}>
          <Ionicons name="cloud-offline-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.syncText} numberOfLines={1}>{"Saved on this phone. Syncing when you're online."}</Text>
        </Pressable>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ 2. share: numbers + overlay + share, one screen */

type Draft = { minutes: string; calories: string; avg: string; max: string };
const NUMBER_FIELDS: { k: keyof Draft; label: string }[] = [
  { k: 'minutes', label: 'MIN' },
  { k: 'calories', label: 'CAL' },
  { k: 'avg', label: 'AVG HR' },
  { k: 'max', label: 'MAX HR' },
];
const str = (n: number | null | undefined) => (n != null ? String(n) : '');
const num = (s: string) => { const n = parseInt(s, 10); return Number.isFinite(n) && n > 0 ? n : null; };

/** Exported for Profile > Workout History (components/v3/CompletedStatsOverlay): the same share screen, rebuilt from the server. */
export function Share(p: {
  data: ShareData; record: SessionRecord; insets: { top: number; bottom: number }; onSaveAfter: (patch: Partial<AfterIntent>) => void;
  onDone: () => void; onShared?: (via: string) => void; header?: React.ReactNode;
  /** one quiet line above Done (saved / syncing) */
  status?: React.ReactNode;
  /** work steps completed / planned, for the no-heart-rate intensity */
  work?: { done: number; total: number } | null;
  /** fill the numbers from Health without a tap (fresh completions; Profile history leaves it to the Sync button) */
  autoSync?: boolean;
  /** false while the celebration screen covers this one: the rings wait to sweep in until it lifts */
  revealed?: boolean;
}) {
  const { width, height } = useWindowDimensions();
  const after = p.record.after;
  const [treatment, setTreatment] = useState<ShareTreatment>('rings');
  const [wearableState, setWearableState] = useState<'idle' | 'syncing' | 'synced' | 'empty' | 'unavailable'>(wearableAvailable() ? 'idle' : 'unavailable');
  const [sharing, setSharing] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const cardRef = useRef<View>(null);
  const storyRef = useRef<View>(null);
  const [draft, setDraft] = useState<Draft>({ minutes: str(p.data.minutes), calories: str(after?.calories), avg: str(after?.avg_heart_rate), max: str(after?.max_heart_rate) });
  const saved = useRef<Draft>(draft);
  /** fields the athlete typed: the automatic Health pass never overwrites these (the Sync button still can) */
  const edited = useRef<Set<keyof Draft>>(new Set());
  const fullSync = useRef(false);
  const [goalPrefs, setGoalPrefs] = useState<RingGoalPrefs>({ minutes: null, calories: null });
  const [goalsOpen, setGoalsOpen] = useState(false);
  useEffect(() => { let alive = true; loadRingGoals().then((g) => alive && setGoalPrefs(g)); return () => { alive = false; }; }, []);
  const autoGoals = { minutes: p.data.minutesGoal ?? 60, calories: p.data.caloriesGoal ?? 420 };
  const goals = resolveRingGoals(goalPrefs, autoGoals);

  // typed numbers show on the card as you type; they are saved when the field loses focus (or on Share / Done)
  const live: ShareData = useMemo(() => {
    const minutes = num(draft.minutes) ?? p.data.minutes;
    const avgHr = num(draft.avg), maxHr = num(draft.max);
    // pace for intensity stays measured against the workout's own length, not the athlete's ring goal
    const it = sessionIntensity({ avgHr, maxHr, workDone: p.work?.done, workTotal: p.work?.total, minutes, goalMinutes: p.data.minutesGoal });
    return { ...p.data, minutes, calories: num(draft.calories), avgHr, maxHr, intensity: it?.value ?? null, intensitySource: it?.source ?? null, minutesGoal: goals.minutes, caloriesGoal: goals.calories };
  }, [p.data, draft, p.work?.done, p.work?.total, goals.minutes, goals.calories]);

  const commit = () => {
    const d = draft, s0 = saved.current;
    if (d.minutes === s0.minutes && d.calories === s0.calories && d.avg === s0.avg && d.max === s0.max) return;
    saved.current = d;
    p.onSaveAfter({ duration_actual: num(d.minutes), calories: num(d.calories), avg_heart_rate: num(d.avg), max_heart_rate: num(d.max), source: 'edited' });
  };

  const windowISO = () => [new Date(p.record.startedAt).toISOString(), new Date(p.record.endedAt ?? Date.now()).toISOString()] as const;

  /** manual Sync: Health replaces every number it has. auto: Health fills only what the athlete has not typed. */
  const applyWearable = (n: WearableNumbers, mode: 'manual' | 'auto') => {
    const keep = mode === 'auto' ? edited.current : new Set<keyof Draft>();
    if (mode === 'manual') {
      p.onSaveAfter(afterFromWearable(n));
      edited.current.clear();
    } else {
      const patch: Partial<AfterIntent> = { steps: n.steps, hrv_sdnn: n.hrv_sdnn, source: keep.size ? 'edited' : 'wearable' };
      if (!keep.has('calories') && n.calories != null) patch.calories = n.calories;
      if (!keep.has('avg') && n.avg_heart_rate != null) patch.avg_heart_rate = n.avg_heart_rate;
      if (!keep.has('max') && n.max_heart_rate != null) patch.max_heart_rate = n.max_heart_rate;
      p.onSaveAfter(patch);
    }
    setDraft((d) => {
      const next = {
        ...d,
        calories: n.calories != null && !keep.has('calories') ? String(n.calories) : d.calories,
        avg: n.avg_heart_rate != null && !keep.has('avg') ? String(n.avg_heart_rate) : d.avg,
        max: n.max_heart_rate != null && !keep.has('max') ? String(n.max_heart_rate) : d.max,
      };
      saved.current = next;
      return next;
    });
    if (n.matched_workout) fullSync.current = true;
  };

  const sync = async () => {
    setWearableState('syncing');
    const [startISO, endISO] = windowISO();
    const n = await syncWearable(startISO, endISO);
    if (!n) { setWearableState('empty'); return; }
    applyWearable(n, 'manual');
    setWearableState('synced');
  };

  // Connect ask (Oct 2026): a fresh finish is the moment the wearable pays off, so anyone who has never seen the Health
  // permission sheet gets one card here. Granting fills the numbers straight away; either answer retires the card (the
  // status leaves 'notDetermined') and marks Health onboarding done so the gate does not ask again.
  const health = useHealth();
  const [connecting, setConnecting] = useState(false);
  const askConnect = !!p.autoSync && wearableState !== 'unavailable' && health.available && health.status === 'notDetermined';
  const connect = async () => {
    if (connecting) return;
    Keyboard.dismiss();
    setConnecting(true);
    let granted = false;
    try { granted = await health.requestPermissions(); } catch { granted = false; }
    await setHealthOnboardingComplete().catch(() => undefined);
    setConnecting(false);
    if (!granted) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setWearableState('syncing');
    const [startISO, endISO] = windowISO();
    const n = await syncWearable(startISO, endISO).catch(() => null);
    if (n) { applyWearable(n, 'auto'); setWearableState('synced'); } else setWearableState('idle');
  };

  // automatic pass: now, at 15s and at 55s (a Watch hands its workout to Health a few seconds after it ends), and whenever
  // the app returns to the front, until a Watch workout matching the session has been read
  useEffect(() => {
    if (!p.autoSync || !wearableAvailable()) return;
    let alive = true, busy = false, first = true;
    const attempt = async () => {
      if (!alive || busy || fullSync.current) return;
      busy = true;
      try {
        if (!(await wearableAuthorized())) return;
        if (first) setWearableState('syncing');
        const [startISO, endISO] = windowISO();
        const n = await syncWearable(startISO, endISO);
        if (!alive) return;
        if (n) { applyWearable(n, 'auto'); setWearableState('synced'); }
        else if (first) setWearableState('idle');
      } catch {
        if (alive && first) setWearableState('idle');
      } finally {
        first = false;
        busy = false;
      }
    };
    attempt();
    const timers = [setTimeout(attempt, 15_000), setTimeout(attempt, 55_000)];
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') attempt(); });
    return () => { alive = false; timers.forEach(clearTimeout); sub.remove(); };
  }, [p.autoSync]); // eslint-disable-line react-hooks/exhaustive-deps

  const share = async (preferInstagram: boolean) => {
    Keyboard.dismiss();
    commit();
    Haptics.impactAsync(preferInstagram ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    setSharing(true);
    setShareNote(null);
    const res = await shareCard(preferInstagram ? storyRef.current : cardRef.current, { transparent: preferInstagram, preferInstagram });
    setSharing(false);
    if (res.ok) { p.onShared?.(res.via); if (res.via === 'instagram') setShareNote('Saved to your photos. In Instagram, add it from Recents as a sticker.'); }
    else setShareNote(res.message);
  };

  // Instagram: a quick how-to first (the overlay lands in the camera roll; IG's Add photo sticker puts it on the Story),
  // until the athlete ticks "Don't show this again"
  const [igTip, setIgTip] = useState(false);
  const igTipOff = useRef<boolean | null>(null);
  useEffect(() => { loadIgTipOff().then((v) => { igTipOff.current = v; }); }, []);
  const onInstagram = () => {
    Keyboard.dismiss();
    if (igTipOff.current) share(true);
    else setIgTip(true);
  };

  // everything fits one screen: the card takes the height that is left (1:1 square), never wider than 300
  const FIXED = (p.header ? 118 : 36) /* done header / title */ + 74 /* numbers */ + 44 /* goals · health */ + 30 /* source line */ + 44 /* overlay picker */ + 64 /* share row */ + 66 /* Done */ + (p.status ? 22 : 0) + (askConnect ? 66 : 0) + 24;
  const avail = height - p.insets.top - 8 - p.insets.bottom - FIXED;
  const cardW = Math.max(200, Math.min(300, width - 88, Math.floor(avail)));
  const source = after?.source === 'wearable' ? 'From your wearable. Tap a number to change it.' : 'Tap a number to type it. No estimates.';

  return (
    <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} accessible={false} testID="v3-complete-results">
      <View style={{ flex: 1, paddingHorizontal: 22 }}>
        {p.header}
        <View style={[styles.shareHead, p.header ? { height: 30, marginTop: 2 } : null]}>
          <Text style={p.header ? styles.shareLabel : styles.title3}>{p.header ? 'SHARE YOUR WORKOUT' : 'Share your workout'}</Text>
        </View>
        <View style={styles.numbers} testID="v3-results-numbers">
          {NUMBER_FIELDS.map((f) => (
            <View key={f.k} style={styles.number}>
              <TextInput
                value={draft[f.k]}
                onChangeText={(v) => { edited.current.add(f.k); setDraft((d) => ({ ...d, [f.k]: v.replace(/[^0-9]/g, '') })); }}
                onBlur={commit}
                onSubmitEditing={commit}
                keyboardType="number-pad"
                returnKeyType="done"
                placeholder="–"
                placeholderTextColor="rgba(255,255,255,0.28)"
                selectTextOnFocus
                maxLength={f.k === 'minutes' ? 3 : 4}
                style={styles.numberInput}
                accessibilityLabel={`${f.label}, tap to edit`}
                testID={`v3-results-input-${f.k}`}
              />
              <Text style={styles.numberK}>{f.label}</Text>
            </View>
          ))}
        </View>
        {/* right under the numbers: set the ring goals, pull from Health */}
        <View style={styles.tools}>
          <Pressable onPress={() => setGoalsOpen(true)} style={({ pressed }) => [styles.toolBtn, pressed && { opacity: 0.75 }]} testID="v3-results-goals" hitSlop={4}>
            <Ionicons name="disc-outline" size={15} color={COLORS.textPrimary} />
            <Text style={styles.smallBtnText}>Adjust goals</Text>
          </Pressable>
          {wearableState !== 'unavailable' && !askConnect ? (
            <Pressable onPress={sync} disabled={wearableState === 'syncing'} style={({ pressed }) => [styles.toolBtn, pressed && { opacity: 0.75 }]} testID="v3-results-sync" hitSlop={4}>
              {wearableState === 'syncing' ? <ActivityIndicator size="small" color={COLORS.textPrimary} /> : <Ionicons name="watch-outline" size={15} color={COLORS.textPrimary} />}
              <Text style={styles.smallBtnText}>{wearableState === 'synced' ? 'Synced' : wearableState === 'empty' ? 'Nothing in Health' : 'Sync Health'}</Text>
            </Pressable>
          ) : null}
        </View>
        {askConnect ? (
          <Pressable onPress={connect} disabled={connecting} style={({ pressed }) => [styles.connect, pressed && { opacity: 0.85 }]} testID="v3-results-connect-health" accessibilityLabel={`Connect ${HEALTH_NAME}`}>
            <View style={styles.connectIcon}><Ionicons name="watch-outline" size={18} color={COLORS.accent} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.connectTitle} numberOfLines={1}>Connect {HEALTH_NAME}</Text>
              <Text style={styles.connectSub} numberOfLines={1}>Fill calories and heart rate from your watch, every workout.</Text>
            </View>
            <View style={styles.connectBtn}>
              {connecting ? <ActivityIndicator size="small" color={COLORS.accentInk} /> : <Text style={styles.connectBtnText}>Connect</Text>}
            </View>
          </Pressable>
        ) : null}
        <Text style={styles.source} numberOfLines={1}>{source}</Text>

        <View style={styles.treatments}>
          {SHARE_TREATMENTS.map((tr) => (
            <Pressable key={tr.id} onPress={() => setTreatment(tr.id)} style={[styles.treatment, treatment === tr.id && styles.treatmentOn]} testID={`v3-share-${tr.id}`}>
              <Text style={[styles.treatmentText, treatment === tr.id && { color: COLORS.accentInk }]}>{tr.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Pressable onPress={treatment === 'rings' ? () => setGoalsOpen(true) : undefined} accessibilityLabel={treatment === 'rings' ? 'Ring card, tap to set your goals' : undefined}>
            <ShareCard ref={cardRef} data={live} treatment={treatment} width={cardW} animate={!!p.autoSync} play={p.revealed !== false} />
          </Pressable>
        </View>
        <View style={styles.shareRow}>
          <InstagramButton onPress={onInstagram} disabled={sharing} />
          <Pressable onPress={() => share(false)} disabled={sharing} style={({ pressed }) => [styles.shareIconBtn, pressed && { opacity: 0.8 }]} testID="v3-share-sheet" accessibilityLabel="Share">
            {sharing ? <ActivityIndicator size="small" color={COLORS.textPrimary} /> : <Ionicons name="share-outline" size={21} color={COLORS.textPrimary} />}
          </Pressable>
        </View>
        {shareNote ? <Text style={styles.source} numberOfLines={2}>{shareNote}</Text> : null}
        {/* offscreen transparent copy for the Instagram sticker */}
        <View style={styles.offscreen} pointerEvents="none">
          <ShareCard ref={storyRef} data={live} treatment={treatment} width={360} transparent />
        </View>
      </View>
      <InstagramTip
        visible={igTip}
        bottomInset={p.insets.bottom}
        onClose={() => setIgTip(false)}
        onGo={(dontShow) => {
          setIgTip(false);
          if (dontShow) { igTipOff.current = true; saveIgTipOff(); }
          // let the sheet slide away before the capture and the hop to Instagram
          setTimeout(() => share(true), 320);
        }}
      />
      <GoalsSheet
        visible={goalsOpen}
        prefs={goalPrefs}
        auto={resolveRingGoals({ minutes: null, calories: null }, autoGoals)}
        bottomInset={p.insets.bottom}
        onClose={() => setGoalsOpen(false)}
        onSave={(g) => { setGoalPrefs(g); saveRingGoals(g); setGoalsOpen(false); }}
      />
      <View style={[styles.actions, { paddingBottom: p.insets.bottom + 12 }]}>
        {p.status ? <View style={{ alignItems: 'center', marginBottom: 2 }}>{p.status}</View> : null}
        <Pressable onPress={() => { Keyboard.dismiss(); commit(); p.onDone(); }} testID="v3-results-done" style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.8 }]}>
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

/** Instagram's own icon gradient (yellow, orange, pink, purple, blue): the whole share button wears it (founder ask). */
const IG_GRADIENT = ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5'];

/** The primary action: a pill in Instagram's own gradient with a white mark and label and a slow light sweep, so sharing is
 *  the obvious next move. */
function InstagramButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  const [w, setW] = useState(0);
  const sweep = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!w) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(1800),
      Animated.timing(sweep, { toValue: 1, duration: 950, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.delay(1600),
    ]));
    loop.start();
    return () => loop.stop();
  }, [w, sweep]);
  return (
    <Pressable onPress={onPress} disabled={disabled} onLayout={(e) => setW(e.nativeEvent.layout.width)} testID="v3-share-instagram" style={({ pressed }) => [styles.igWrap, pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 }]} accessibilityLabel="Share to your Instagram Story">
      <LinearGradient colors={IG_GRADIENT} locations={[0, 0.25, 0.5, 0.75, 1]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.ig as any}>
        {w ? (
          <Animated.View pointerEvents="none" style={[styles.igSweep, { transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-90, w + 30] }) }, { skewX: '-20deg' }] }]}>
            <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.38)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 } as any} />
          </Animated.View>
        ) : null}
        <Ionicons name="logo-instagram" size={21} color="#FFFFFF" />
        <Text style={styles.igText} numberOfLines={1}>Share to Story</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  medal: { width: 92, height: 92, borderRadius: 46, padding: 3, backgroundColor: 'rgba(255,255,255,0.06)', marginTop: 10 },
  medalInner: { flex: 1, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary, marginTop: 20, letterSpacing: -0.8 },
  title3: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.4, flexShrink: 1 },
  sub: { fontSize: 16, color: COLORS.textSecondary, marginTop: 6, fontWeight: '600', textAlign: 'center' },
  did: { fontSize: 15, color: COLORS.textPrimary, marginTop: 10, fontWeight: '700', textAlign: 'center', fontVariant: ['tabular-nums'] },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: 16, rowGap: 6, marginTop: 14 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  streakText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  sync: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  syncText: { fontSize: 13, color: COLORS.textSecondary },
  ask: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginTop: 30, letterSpacing: -0.4 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  choiceLabel: { fontSize: 16.5, fontWeight: '800', color: COLORS.textPrimary },
  choiceHint: { fontSize: 13, color: COLORS.textTertiary, marginTop: 2 },
  cool: { flexDirection: 'row', gap: 7, marginTop: 16, paddingHorizontal: 2 },
  coolText: { flex: 1, fontSize: 13, lineHeight: 18, color: COLORS.textTertiary },
  actions: { paddingHorizontal: 20, paddingTop: 8, gap: 8 },
  quiet: { alignItems: 'center', paddingVertical: 12 },
  quietText: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary },
  cta: { height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 17, fontWeight: '800', color: COLORS.accentInk },
  doneHead: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 6, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.10)', marginBottom: 6 },
  doneMedalWrap: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center' },
  doneHalo: { position: 'absolute', width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: COLORS.accent },
  doneMedal: { width: 58, height: 58, borderRadius: 29, padding: 3, backgroundColor: 'rgba(255,255,255,0.06)' },
  doneMedalInner: { flex: 1, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  doneSub: { fontSize: 13.5, color: COLORS.textSecondary, fontWeight: '600', marginTop: 1 },
  doneDid: { fontSize: 13.5, color: COLORS.textPrimary, fontWeight: '700', marginTop: 2, fontVariant: ['tabular-nums'] },
  doneMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  doneMetaText: { fontSize: 12.5, fontWeight: '700', color: COLORS.textPrimary },
  shareLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.6, color: COLORS.textTertiary },
  shareHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, height: 36 },
  numbers: { flexDirection: 'row', gap: 8, marginTop: 10 },
  number: { flex: 1, alignItems: 'center', paddingTop: 6, paddingBottom: 8, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  numberInput: { alignSelf: 'stretch', height: 36, padding: 0, textAlign: 'center', fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, fontVariant: ['tabular-nums'] },
  numberK: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, color: COLORS.textTertiary, marginTop: 1 },
  tools: { flexDirection: 'row', gap: 8, marginTop: 8 },
  toolBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.07)' },
  smallBtnText: { fontSize: 12.5, fontWeight: '700', color: COLORS.textPrimary },
  source: { fontSize: 12, color: COLORS.textTertiary, marginTop: 8, lineHeight: 17 },
  treatments: { flexDirection: 'row', gap: 8, marginTop: 10 },
  treatment: { flex: 1, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' },
  treatmentOn: { backgroundColor: COLORS.accent },
  treatmentText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  shareRow: { flexDirection: 'row', gap: 10, marginTop: 6, height: 56 },
  igWrap: { flex: 1, borderRadius: 18, shadowColor: '#D62976', shadowOpacity: 0.32, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  ig: { flex: 1, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, overflow: 'hidden' },
  igSweep: { position: 'absolute', top: -10, bottom: -10, left: 0, width: 60 },
  igText: { fontSize: 16.5, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  shareIconBtn: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  doneBtn: { height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  shareText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  offscreen: { position: 'absolute', left: -9999, top: 0 },
  connect: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 58, marginTop: 8, paddingLeft: 12, paddingRight: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)' },
  connectIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' },
  connectTitle: { fontSize: 14.5, fontWeight: '800', color: COLORS.textPrimary },
  connectSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  connectBtn: { height: 36, minWidth: 84, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accent },
  connectBtnText: { fontSize: 13.5, fontWeight: '800', color: COLORS.accentInk },
});
