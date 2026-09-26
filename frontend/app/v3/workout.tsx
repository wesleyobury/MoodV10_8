/**
 * V3 Workout Preview: /v3/workout?id=<workout_id>  (Phase 2.5)
 *
 * Home → Build → Preview → Start Workout. The Preview is compact: what the session is, how it is organised
 * (STRAIGHT SETS, SUPERSET A1/A2, CIRCUIT, HYBRID anchor + stations, ATHLETIC EXPOSURE with its quality cue) and
 * four actions: session type, Start Workout, Built for Today / Details, Different Workout.
 *
 * The rich Overview (Built for Today, warm-up, per-exercise cues, progression, Swap Exercise) lives on
 * /v3/details. The server stays the source of truth: every change here is a real API call and the screen only
 * shows the envelope it gets back.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { trackEvent } from '../../utils/analytics';
import {
  V3Conflict,
  V3ConflictOption,
  V3Envelope,
  V3GenerateRequest,
  generateV3Workout,
  getV3Workout,
  localDateISO,
  swapV3Workout,
} from '../../utils/v3Api';
import { readCachedEnvelope, readToday, updateTodayEnvelope, writeToday } from '../../utils/v3Today';
import { requestSignature } from '../../utils/v3HomeModel';
import { exerciseCount, workoutTitle } from '../../utils/v3OverviewFormat';
import { requestFor, typeLabel, withArchetype } from '../../utils/v3PreviewFormat';
import { PreviewSections } from '../../components/v3/PreviewSections';
import { ArchetypeSheet } from '../../components/v3/ArchetypeSheet';
import { ConflictSheet } from '../../components/v3/ConflictSheet';

export default function V3WorkoutPreview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const { token, user } = useAuth();
  const uid = user?.id ?? null;

  const [wid, setWid] = useState<string | undefined>(params.id);
  const [env, setEnv] = useState<V3Envelope | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | 'different' | 'type'>(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const [conflict, setConflict] = useState<{ conflict: V3Conflict; req: V3GenerateRequest } | null>(null);
  const [changeNote, setChangeNote] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const viewedFor = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const track = useCallback(
    (name: string, meta: Record<string, any> = {}) => {
      if (token) trackEvent(token, name, { workout_id: wid, ...meta });
    },
    [token, wid],
  );

  const showToast = (msg: string) => {
    setToast(msg);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(2600),
      Animated.timing(toastOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  const accept = useCallback(
    (next: V3Envelope) => {
      setEnv(next);
      if (uid) updateTodayEnvelope(uid, next);
    },
    [uid],
  );

  // Load: cached envelope first (instant), then the server copy.
  useEffect(() => {
    if (!wid || !token) return;
    let alive = true;
    (async () => {
      if (uid) {
        const cached = await readCachedEnvelope(uid, wid);
        if (alive && cached) setEnv((e) => (e?.workout?.workout_id === wid ? e : cached));
      }
      const res = await getV3Workout(token, wid);
      if (!alive) return;
      if (res.ok) accept(res.envelope);
      else setLoadError(res.error.message);
    })();
    return () => {
      alive = false;
    };
  }, [wid, token, uid, accept]);

  // Back from Details: pick up an exercise swap made there.
  useFocusEffect(
    useCallback(() => {
      if (!uid || !wid) return;
      readCachedEnvelope(uid, wid).then((c) => {
        if (c?.workout?.workout_id === wid) setEnv(c);
      });
    }, [uid, wid]),
  );

  useEffect(() => {
    const w = env?.workout;
    if (!w || viewedFor.current === w.workout_id) return;
    viewedFor.current = w.workout_id;
    track('v3_preview_viewed', {
      direction: w.direction,
      archetype: w.archetype.id,
      selection_source: w.selection_source ?? null,
      target_mode: w.target.mode,
      duration: w.duration.requested_minutes,
      estimated_minutes: w.duration.estimated_minutes,
      exercises: exerciseCount(w),
      structures: w.blocks.map((b) => b.structure),
    });
  }, [env, track]);

  const resetScroll = () => scrollRef.current?.scrollTo({ y: 0, animated: false });

  /* ------------------------------------------------------------ Different Workout */
  const onDifferent = async () => {
    const w = env?.workout;
    if (!token || !wid || !w || busy) return;
    const from = w.archetype;
    setBusy('different');
    setChangeNote(null);
    track('v3_swap_workout_tapped', { swap_count: w.swap_count, selection_source: w.selection_source ?? null, archetype: from.id });
    const res = await swapV3Workout(token, wid);
    setBusy(null);
    if (!res.ok || res.envelope.status === 'conflict' || !res.envelope.workout) {
      const msg = res.ok ? res.envelope.conflict?.message || "Couldn't find another workout for these choices." : res.error.message;
      track('v3_swap_workout_result', { result: res.ok ? res.envelope.conflict?.code ?? 'conflict' : 'error' });
      showToast(msg);
      return;
    }
    const next = res.envelope.workout;
    const changed = next.archetype.id !== from.id;
    const before = new Set(w.blocks.flatMap((b) => b.items.map((i) => i.exercise.id)));
    const after = next.blocks.flatMap((b) => b.items.map((i) => i.exercise.id));
    const changedCount = after.filter((x) => !before.has(x)).length;
    accept(res.envelope);
    resetScroll();
    track('v3_swap_workout_result', {
      result: 'swapped',
      archetype_changed: changed,
      from: from.id,
      to: next.archetype.id,
      selection_source: next.selection_source ?? null,
      exercises_changed: changedCount,
      exercises_total: after.length,
      swap_count: next.swap_count,
    });
    if (changed) {
      setChangeNote(`New type: ${from.name} → ${next.archetype.name}`);
      showToast(`MOOD switched to ${next.archetype.name}`);
    } else {
      setChangeNote(`Same ${next.archetype.name} setup · ${changedCount} of ${after.length} exercises changed`);
      showToast(`Here's a different ${next.archetype.name} workout`);
    }
  };

  /* ------------------------------------------------------------ Session type */
  const regenerate = async (req: V3GenerateRequest, meta: Record<string, any>) => {
    if (!token || !uid) return;
    setBusy('type');
    setChangeNote(null);
    const res = await generateV3Workout(token, req);
    setBusy(null);
    if (!res.ok) {
      track('v3_archetype_change_result', { ...meta, result: 'error', error_kind: res.error.kind });
      showToast(res.error.message);
      return;
    }
    const e = res.envelope;
    if (e.status === 'conflict' || !e.workout?.workout_id) {
      track('v3_archetype_change_result', { ...meta, result: e.conflict?.code ?? 'conflict' });
      if (e.conflict) setConflict({ conflict: e.conflict, req });
      return;
    }
    const newId = e.workout.workout_id;
    await writeToday(uid, { date: req.date, workout_id: newId, signature: requestSignature(req), request: req, envelope: e, saved_at: new Date().toISOString() });
    setEnv(e);
    setWid(newId);
    router.setParams({ id: newId } as any);
    resetScroll();
    track('v3_archetype_change_result', { ...meta, result: 'ok', to_resolved: e.workout.archetype.id, outcome: e.outcome });
    setChangeNote(meta.to === 'moods_pick' ? `MOOD's Pick: ${e.workout.archetype.name}` : `Type set to ${e.workout.archetype.name}`);
  };

  const onType = async (archetype: string | null) => {
    setTypeOpen(false);
    const w = env?.workout;
    if (!w || !uid || busy) return;
    const src = w.selection_source ?? 'moods_pick';
    const current = src === 'user_selected' ? w.archetype.id : null;
    if (archetype === current && src !== 'target') return;
    const today = await readToday(uid, localDateISO());
    const stored = today && today.workout_id === wid ? today.request : null;
    const req = { ...withArchetype(requestFor(w, stored), archetype), date: localDateISO(), persist: true };
    const meta = { surface: 'preview', direction: w.direction, from: current ?? (src === 'target' ? 'target' : 'moods_pick'), to: archetype ?? 'moods_pick', cleared_target: src === 'target' };
    track('v3_archetype_changed', meta);
    await regenerate(req, meta);
  };

  const onConflictOption = (o: V3ConflictOption) => {
    const c = conflict;
    setConflict(null);
    if (!c || !o.patch) return;
    const req = { ...c.req, ...(o.patch as Partial<V3GenerateRequest>) };
    regenerate(req, { surface: 'preview_conflict', action: o.action, to: req.archetype ?? 'moods_pick' });
  };

  /* ------------------------------------------------------------ navigation */
  const onDetails = () => {
    if (!wid) return;
    track('v3_details_opened', { source: 'preview' });
    router.push({ pathname: '/v3/details', params: { id: wid } } as any);
  };

  const onStart = () => {
    const w = env?.workout;
    if (!w || !wid) return;
    track('v3_start_workout_tapped', { direction: w.direction, archetype: w.archetype.id, surface: 'preview' });
    router.push({ pathname: '/v3/session', params: { id: wid } } as any);
  };

  /* ------------------------------------------------------------ render */
  const w = env?.workout ?? null;
  const tl = w ? typeLabel(w) : null;
  const { title, subtitle } = w ? workoutTitle(w) : { title: '', subtitle: null };
  const firstWhy = w?.built_for_today?.[0]?.text ?? null;

  return (
    <View style={styles.root} testID="v3-preview">
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back} accessibilityLabel="Back" testID="v3-preview-back">
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </Pressable>
        {w ? (
          <Pressable onPress={onDetails} hitSlop={8} style={styles.detailsLink} testID="v3-preview-details-top">
            <Text style={styles.detailsLinkText}>Details</Text>
          </Pressable>
        ) : null}
      </View>

      {!w ? (
        <View style={styles.center}>
          {loadError ? (
            <>
              <Text style={styles.errorText}>{loadError}</Text>
              <Pressable onPress={() => router.back()} style={styles.errorBtn}>
                <Text style={styles.errorBtnText}>Back to Home</Text>
              </Pressable>
            </>
          ) : (
            <ActivityIndicator color={COLORS.accent} />
          )}
        </View>
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 150 }]} showsVerticalScrollIndicator={false}>
          <View style={busy ? { opacity: 0.4 } : null}>
            {/* Identity */}
            <Text style={styles.eyebrow}>{`${w.direction_name.toUpperCase()} · ${w.duration.display.toUpperCase()}`}</Text>
            <Text style={styles.title} testID="v3-preview-title">{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <Text style={styles.facts}>
              {[`${exerciseCount(w)} exercises`, w.equipment.preset !== 'commercial_gym' ? w.equipment.label : null].filter(Boolean).join('  ·  ')}
            </Text>

            {changeNote ? (
              <View style={styles.changeNote} testID="v3-preview-change-note">
                <Ionicons name="shuffle" size={14} color={COLORS.accent} />
                <Text style={styles.changeNoteText}>{changeNote}</Text>
              </View>
            ) : null}

            {/* Session type */}
            <Pressable onPress={() => setTypeOpen(true)} disabled={!!busy} style={({ pressed }) => [styles.typeRow, pressed && { opacity: 0.8 }]} testID="v3-preview-type">
              <View style={{ flex: 1 }}>
                <Text style={styles.typeLabel}>TYPE</Text>
                <Text style={styles.typeValue}>{tl?.value}</Text>
              </View>
              <Text style={styles.typeChange}>Change</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
            </Pressable>

            {/* Structure */}
            <PreviewSections workout={w} />

            {/* Built for Today teaser */}
            <Pressable onPress={onDetails} style={({ pressed }) => [styles.why, pressed && { opacity: 0.85 }]} testID="v3-preview-details">
              <View style={styles.whyHead}>
                <Ionicons name="sparkles" size={14} color={COLORS.accent} />
                <Text style={styles.whyTitle}>BUILT FOR TODAY</Text>
              </View>
              {firstWhy ? <Text style={styles.whyText} numberOfLines={2}>{firstWhy}</Text> : null}
              <View style={styles.whyMore}>
                <Text style={styles.whyMoreText}>Why MOOD built this · warm-up · exercise details</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.textSecondary} />
              </View>
            </Pressable>
          </View>

          <Pressable onPress={onDifferent} disabled={!!busy} style={({ pressed }) => [styles.diff, (pressed || !!busy) && { opacity: 0.6 }]} testID="v3-swap-workout">
            {busy === 'different' ? <ActivityIndicator size="small" color={COLORS.textSecondary} /> : <Ionicons name="shuffle" size={16} color={COLORS.textSecondary} />}
            <Text style={styles.diffText}>Different workout</Text>
          </Pressable>
          <Text style={styles.diffHint}>
            {w.selection_source === 'moods_pick'
              ? 'MOOD may pick a different type.'
              : w.selection_source === 'target'
                ? 'Keeps your Target and changes the exercises.'
                : `Keeps ${w.archetype.name} and changes the exercises.`}
          </Text>
        </ScrollView>
      )}

      {w ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <LinearGradient colors={['rgba(10,10,10,0)', COLORS.bg]} style={styles.fade as any} />
          <Pressable onPress={onStart} disabled={!!busy} testID="v3-start-workout">
            <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.cta, !!busy && { opacity: 0.6 }] as any}>
              {busy === 'type' ? <ActivityIndicator color={COLORS.accentInk} /> : <Ionicons name="play" size={18} color={COLORS.accentInk} />}
              <Text style={styles.ctaText}>{busy === 'type' ? 'Building' : 'Start Workout'}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}

      {w ? (
        <ArchetypeSheet
          visible={typeOpen}
          direction={w.direction}
          selected={w.selection_source === 'user_selected' ? w.archetype.id : w.selection_source === 'target' ? '__target__' : null}
          note={
            w.selection_source === 'target'
              ? `Picking a type replaces your Target (${w.target.label}).`
              : 'Same feelings, soreness and length. MOOD rebuilds the session.'
          }
          onSelect={onType}
          onClose={() => setTypeOpen(false)}
        />
      ) : null}
      <ConflictSheet conflict={conflict?.conflict ?? null} onSelect={(o) => onConflictOption(o)} onClose={() => setConflict(null)} />

      {toast ? (
        <Animated.View style={[styles.toast, { top: insets.top + 54, opacity: toastOpacity }]} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { paddingHorizontal: 12, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  detailsLink: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)' },
  detailsLinkText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  scroll: { paddingHorizontal: 20, paddingTop: 10 },
  errorText: { fontSize: 15, lineHeight: 22, color: COLORS.textSecondary, textAlign: 'center' },
  errorBtn: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)' },
  errorBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },

  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2, color: COLORS.accent },
  title: { fontSize: 32, lineHeight: 37, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.6, marginTop: 6 },
  subtitle: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary, marginTop: 4 },
  facts: { fontSize: 13.5, color: COLORS.textSecondary, marginTop: 8 },

  changeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  changeNoteText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },

  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  typeLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.6, color: COLORS.textTertiary },
  typeValue: { fontSize: 15.5, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
  typeChange: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },

  why: {
    marginTop: 24,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.28)',
  },
  whyHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  whyTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8, color: COLORS.accent },
  whyText: { fontSize: 14.5, lineHeight: 21, color: COLORS.textPrimary, marginTop: 8 },
  whyMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  whyMoreText: { fontSize: 12.5, fontWeight: '600', color: COLORS.textSecondary },

  diff: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  diffText: { fontSize: 14.5, fontWeight: '600', color: COLORS.textSecondary },
  diffHint: { fontSize: 12, color: COLORS.textTertiary, textAlign: 'center', marginTop: 8 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20 },
  fade: { position: 'absolute', left: 0, right: 0, top: -36, bottom: 0 },
  cta: { height: 56, borderRadius: 18, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 17, fontWeight: '800', color: COLORS.accentInk },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(38,38,38,0.96)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    maxWidth: '88%',
  },
  toastText: { fontSize: 13.5, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
});
