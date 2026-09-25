/**
 * V3Home — Today's Workout.
 *
 * "Onboarding tells MOOD who you are as an athlete. Home tells MOOD how you are
 * today." The Training Profile (server) supplies goal, experience, frequency
 * and equipment; Home only asks for today's inputs:
 *
 *   A. How are you feeling?   States (optional, max 3) + sore areas
 *   B. What are we doing?     Strength / Sweat / Athletic (always one selected)
 *   C. Focus + Length         MOOD's Pick by default, optional Target; 60 / 30
 *   D. Build workout          POST /api/v3/workouts/generate -> Overview
 *
 * Zero-input path: default Direction + MOOD's Pick + 60 min = one tap.
 * First visit only: the Phase 1 barrier prefill (visible, removable).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { trackEvent } from '../../utils/analytics';
import {
  FirstHomeHandoff,
  consumeFirstHomeHandoff,
  fetchTrainingProfile,
  readFirstHomeHandoff,
} from '../../utils/v3Profile';
import {
  V3Conflict,
  V3ConflictOption,
  V3Direction,
  V3State,
  generateV3Workout,
  localDateISO,
} from '../../utils/v3Api';
import {
  BARRIER_BANNER,
  BarrierKey,
  DIRECTIONS,
  DURATIONS,
  HomeInputs,
  MAX_STATES,
  SORE_REGIONS,
  STATES,
  STATE_LABEL,
  TARGETS,
  applyConflictOption,
  buildBlocker,
  buildRequest,
  clearTarget,
  initialInputs,
  isTargetSelected,
  moodsPickCopy,
  requestSignature,
  setDirection,
  setDuration,
  summaryLine,
  targetLabel,
  targetSupported,
  toggleSoreRegion,
  toggleState,
  toggleTarget,
} from '../../utils/v3HomeModel';
import { V3TodayEntry, readLastDirection, readToday, writeLastDirection, writeToday } from '../../utils/v3Today';
import { V3Chip } from './V3Chip';
import { ConflictSheet } from './ConflictSheet';

const VALID_STATES = new Set<string>(STATES.map((s) => s.id));

function dateEyebrow(d = new Date()): string {
  const wd = d.toLocaleDateString('en-US', { weekday: 'long' });
  const md = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${wd} · ${md}`.toUpperCase();
}

export default function V3Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const uid = user?.id ?? null;

  const [inputs, setInputs] = useState<HomeInputs | null>(null);
  const [handoff, setHandoff] = useState<FirstHomeHandoff | null>(null);
  const [today, setToday] = useState<V3TodayEntry | null>(null);
  const [focusOpen, setFocusOpen] = useState(false);
  const [stateHint, setStateHint] = useState(false);
  const [targetHint, setTargetHint] = useState(false);
  const [building, setBuilding] = useState(false);
  const [conflict, setConflict] = useState<V3Conflict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const directionTouched = useRef(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const track = useCallback(
    (name: string, meta: Record<string, any> = {}) => {
      if (token) trackEvent(token, name, { home_version: 'v3', ...meta });
    },
    [token],
  );

  /* ---------------------------------------------------------------- defaults */
  useEffect(() => {
    if (!uid) return;
    let alive = true;
    (async () => {
      const date = localDateISO();
      const [h, last, t] = await Promise.all([readFirstHomeHandoff(uid), readLastDirection(uid), readToday(uid, date)]);
      if (!alive) return;
      const pending = h && h.pending ? h : null;
      // Direction: last explicitly used V3 Direction > profile default > fallback.
      const dir: V3Direction = last ?? (pending?.default_direction as V3Direction) ?? 'strength';
      const prefillStates = (pending?.prefill?.states ?? []).filter((s) => VALID_STATES.has(s)) as V3State[];
      setInputs(initialInputs(dir, { states: prefillStates, duration: 60 }));
      setHandoff(pending);
      setToday(t);
      track('v3_home_viewed', {
        first_visit: !!pending,
        barrier: pending?.profile?.biggest_barrier ?? null,
        default_direction: dir,
        direction_source: last ? 'last_used' : pending ? 'handoff' : 'fallback',
        has_today_workout: !!t,
      });
      if (!last && token) {
        const prof = await fetchTrainingProfile(token);
        const d = prof?.default_direction;
        if (alive && d && !directionTouched.current) setInputs((i) => (i ? { ...i, direction: d } : i));
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // Coming back to Home: pick up today's workout (a swap on the Overview, or a new day).
  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      readToday(uid, localDateISO()).then(setToday);
    }, [uid]),
  );

  useEffect(() => () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
  }, []);

  const flashHint = (which: 'state' | 'target') => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    which === 'state' ? setStateHint(true) : setTargetHint(true);
    hintTimer.current = setTimeout(() => {
      setStateHint(false);
      setTargetHint(false);
    }, 2600);
  };

  /* ---------------------------------------------------------------- first-visit prefill */
  const barrier = (handoff?.prefill?.copy_key ?? null) as BarrierKey | null;
  const banner = barrier ? BARRIER_BANNER[barrier] : null;
  const suggest30 = !!handoff?.prefill?.suggest_duration;
  const emphasizePick = !!handoff?.prefill?.emphasize_moods_pick;

  const consumeHandoff = useCallback(async () => {
    if (uid) await consumeFirstHomeHandoff(uid);
    setHandoff(null);
  }, [uid]);

  const dismissPrefill = () => {
    const prefilled = (handoff?.prefill?.states ?? []) as V3State[];
    setInputs((i) => (i ? { ...i, states: i.states.filter((s) => !prefilled.includes(s)) } : i));
    track('v3_prefill_dismissed', { barrier });
    consumeHandoff();
  };

  /* ---------------------------------------------------------------- input handlers */
  const onToggleState = (id: V3State) => {
    if (!inputs) return;
    const r = toggleState(inputs, id);
    if (r.limitHit) {
      flashHint('state');
      track('v3_state_limit_reached', { state: id });
      return;
    }
    setInputs(r.inputs);
    setError(null);
    track('v3_state_toggled', { state: id, selected: r.inputs.states.includes(id), count: r.inputs.states.length });
  };

  const onDirection = (d: V3Direction) => {
    if (!inputs || d === inputs.direction) return;
    directionTouched.current = true;
    track('v3_direction_changed', { from: inputs.direction, to: d });
    setInputs(setDirection(inputs, d));
    setError(null);
  };

  const onTarget = (chipId: string) => {
    if (!inputs) return;
    const r = toggleTarget(inputs, chipId);
    if (r.limitHit) {
      flashHint('target');
      return;
    }
    setInputs(r.inputs);
    track('v3_target_changed', { target: r.inputs.target, direction: inputs.direction });
  };

  const onMoodsPick = () => {
    if (!inputs) return;
    setInputs(clearTarget(inputs));
    track('v3_target_changed', { target: null, direction: inputs.direction });
  };

  const onDuration = (d: 30 | 60) => {
    if (!inputs || d === inputs.duration) return;
    setInputs(setDuration(inputs, d));
    track('v3_duration_changed', { duration: d, suggested: suggest30 && d === 30 });
  };

  /* ---------------------------------------------------------------- build */
  const openWorkout = (id: string) => router.push({ pathname: '/v3/workout', params: { id } } as any);

  const build = async (override?: HomeInputs) => {
    const inp = override ?? inputs;
    if (!inp || !token || !uid || building) return;
    if (buildBlocker(inp)) return;
    const date = localDateISO();
    const req = buildRequest(inp, date);
    const sig = requestSignature(req);
    const moodsPick = req.target === undefined && !req.archetype;
    track('v3_generate_tapped', {
      direction: req.direction,
      states: req.states,
      soreness: req.soreness,
      target: req.target ?? null,
      duration: req.duration,
      moods_pick: moodsPick,
      first_visit: !!handoff,
    });
    if (moodsPick) track('v3_moods_pick_used', { direction: req.direction });

    // Same inputs, same day: the workout already exists. Reopen it.
    if (today && today.signature === sig) {
      track('v3_workout_reopened', { workout_id: today.workout_id });
      openWorkout(today.workout_id);
      return;
    }

    setError(null);
    setBuilding(true);
    const res = await generateV3Workout(token, req);
    setBuilding(false);

    if (!res.ok) {
      setError(res.error.message);
      track('v3_generation_outcome', { outcome: 'error', error_kind: res.error.kind, field: res.error.field ?? null });
      return;
    }
    const env = res.envelope;
    track('v3_generation_outcome', {
      outcome: env.outcome,
      direction: env.workout?.direction ?? req.direction,
      archetype: env.workout?.archetype.id ?? null,
      conflict_code: env.conflict?.code ?? null,
      profile_defaults_applied: Object.keys(env.profile_defaults_applied ?? {}),
    });

    if (env.status === 'conflict' || !env.workout) {
      setConflict(env.conflict);
      track('v3_conflict_shown', { code: env.conflict?.code, options: (env.conflict?.options ?? []).map((o) => o.action) });
      return;
    }
    if (env.outcome === 'rerouted') {
      track('v3_rerouted', { from: env.workout.requested_archetype?.id ?? null, to: env.workout.archetype.id });
    }

    await writeLastDirection(uid, inp.direction);
    const entry: V3TodayEntry = {
      date,
      workout_id: env.workout.workout_id as string,
      signature: sig,
      request: req,
      envelope: env,
      saved_at: new Date().toISOString(),
    };
    await writeToday(uid, entry);
    setToday(entry);
    // First successful generation ends the first-visit prefill for good.
    if (handoff) await consumeHandoff();
    if (entry.workout_id) openWorkout(entry.workout_id);
  };

  const onConflictOption = (o: V3ConflictOption, index: number) => {
    if (!inputs) return;
    track('v3_conflict_resolved', { code: conflict?.code, action: o.action, label: o.label, index });
    const r = applyConflictOption(inputs, o);
    setConflict(null);
    if (r.effect === 'close') return;
    if (r.effect === 'open_target_picker') {
      setFocusOpen(true);
      return;
    }
    setInputs(r.inputs);
    build(r.inputs);
  };

  /* ---------------------------------------------------------------- render */
  const blocker = inputs ? buildBlocker(inputs) : null;
  const tLabel = inputs ? targetLabel(inputs.target) : null;
  const canTarget = inputs ? targetSupported(inputs.direction) : true;
  const buildingLine = useMemo(() => {
    if (!inputs) return '';
    const s = inputs.states.map((x) => STATE_LABEL[x]);
    return [DIRECTIONS.find((d) => d.id === inputs.direction)?.name, ...s].filter(Boolean).join(' · ');
  }, [inputs]);

  if (!inputs) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root} testID="v3-home">
      <LinearGradient colors={['#17140b', COLORS.bg]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.45 }} style={StyleSheet.absoluteFillObject as any} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 14 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={styles.eyebrow}>{dateEyebrow()}</Text>
        <Text style={styles.h1}>Today's workout</Text>

        {/* Today's generated workout, reopenable */}
        {today?.envelope.workout ? (
          <Pressable
            onPress={() => {
              track('v3_workout_reopened', { workout_id: today.workout_id, source: 'today_card' });
              openWorkout(today.workout_id);
            }}
            style={({ pressed }) => [styles.todayCard, pressed && { opacity: 0.8 }]}
            testID="v3-today-card"
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.todayEyebrow}>READY TO GO</Text>
              <Text style={styles.todayTitle}>
                {today.envelope.workout.direction_name} · {today.envelope.workout.archetype.name}
              </Text>
              <Text style={styles.todayMeta}>{today.envelope.workout.duration.display}</Text>
            </View>
            <View style={styles.todayOpen}>
              <Text style={styles.todayOpenText}>Open</Text>
              <Ionicons name="chevron-forward" size={15} color={COLORS.accentInk} />
            </View>
          </Pressable>
        ) : null}

        {/* First-visit barrier prefill */}
        {banner ? (
          <View style={styles.banner} testID="v3-prefill-banner">
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>{banner.title}</Text>
              <Text style={styles.bannerBody}>{banner.body}</Text>
            </View>
            <Pressable onPress={dismissPrefill} hitSlop={10} accessibilityLabel="Dismiss" testID="v3-prefill-dismiss">
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.55)" />
            </Pressable>
          </View>
        ) : null}

        {/* A. State */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.h2}>How are you feeling?</Text>
            <Text style={styles.caption}>{stateHint ? `Up to ${MAX_STATES}. Tap one to remove it.` : `Optional · up to ${MAX_STATES}`}</Text>
          </View>
          <View style={styles.wrap}>
            {STATES.map((s) => (
              <V3Chip
                key={s.id}
                label={s.label}
                icon={s.icon}
                selected={inputs.states.includes(s.id)}
                muted={!inputs.states.includes(s.id) && inputs.states.length >= MAX_STATES}
                block
                style={styles.stateCell}
                onPress={() => onToggleState(s.id)}
                testID={`v3-state-${s.id}`}
              />
            ))}
          </View>
          {inputs.states.includes('sore') ? (
            <View style={styles.sore} testID="v3-soreness">
              <Text style={styles.soreLabel}>Where are you sore?</Text>
              <View style={styles.wrap}>
                {SORE_REGIONS.map((r) => (
                  <V3Chip
                    key={r.id}
                    size="sm"
                    label={r.label}
                    selected={inputs.soreness.includes(r.id)}
                    onPress={() => {
                      const next = toggleSoreRegion(inputs, r.id);
                      setInputs(next);
                      track('v3_soreness_changed', { soreness: next.soreness });
                    }}
                    testID={`v3-sore-${r.id}`}
                  />
                ))}
              </View>
              {blocker === 'sore_needs_area' ? <Text style={styles.soreHint}>Pick at least one area so MOOD can work around it.</Text> : null}
            </View>
          ) : null}
        </View>

        {/* B. Direction */}
        <View style={styles.section}>
          <Text style={styles.h2}>What are we doing?</Text>
          <View style={styles.dirRow}>
            {DIRECTIONS.map((d) => {
              const on = inputs.direction === d.id;
              const inner = (
                <View style={[styles.dirInner, on && styles.dirInnerOn]}>
                  <Ionicons name={d.icon as any} size={22} color={on ? COLORS.accent : 'rgba(255,255,255,0.7)'} />
                  <Text style={[styles.dirName, !on && styles.dirNameOff]}>{d.name}</Text>
                  <Text style={styles.dirDesc} numberOfLines={3}>
                    {d.descriptor}
                  </Text>
                </View>
              );
              return (
                <Pressable
                  key={d.id}
                  onPress={() => onDirection(d.id)}
                  style={({ pressed }) => [styles.dirCard, pressed && { transform: [{ scale: 0.98 }] }]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  testID={`v3-direction-${d.id}`}
                >
                  {on ? (
                    <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dirBorder}>
                      {inner}
                    </LinearGradient>
                  ) : (
                    <View style={[styles.dirBorder, styles.dirBorderOff]}>{inner}</View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* C. Focus + Length */}
        <View style={styles.section}>
          <View style={[styles.panel, emphasizePick && !tLabel && styles.panelEmph]}>
            <Pressable
              onPress={() => canTarget && setFocusOpen((v) => !v)}
              style={styles.panelRow}
              disabled={!canTarget}
              testID="v3-focus-toggle"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.panelLabel}>FOCUS</Text>
                <Text style={styles.panelValue}>{inputs.archetype ? 'Adjusted by MOOD' : tLabel ?? "MOOD's Pick"}</Text>
              </View>
              {canTarget ? (
                <View style={styles.change}>
                  <Text style={styles.changeText}>{focusOpen ? 'Done' : 'Change'}</Text>
                  <Ionicons name={focusOpen ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.textSecondary} />
                </View>
              ) : null}
            </Pressable>
            {!tLabel ? <Text style={styles.pickCopy}>{moodsPickCopy(inputs.direction)}</Text> : null}
            {focusOpen && canTarget ? (
              <View style={styles.targets} testID="v3-targets">
                <View style={styles.wrap}>
                  <V3Chip size="sm" label="MOOD's Pick" icon="sparkles" selected={inputs.target === null} onPress={onMoodsPick} testID="v3-target-moods-pick" />
                  {TARGETS.map((t) => (
                    <V3Chip
                      key={t.id}
                      size="sm"
                      label={t.label}
                      selected={isTargetSelected(inputs, t.id)}
                      onPress={() => onTarget(t.id)}
                      testID={`v3-target-${t.id}`}
                    />
                  ))}
                </View>
                <Text style={styles.targetHint}>{targetHint ? 'Up to 3 muscle groups. Arms counts as two.' : 'Pick up to 3, or Full Body.'}</Text>
              </View>
            ) : null}

            <View style={styles.hr} />

            <View style={styles.panelRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.panelLabel}>LENGTH</Text>
                {suggest30 && inputs.duration === 60 ? <Text style={styles.suggest}>Short on time? Try 30.</Text> : null}
              </View>
              <View style={styles.seg}>
                {DURATIONS.map((d) => (
                  <V3Chip
                    key={d}
                    size="sm"
                    label={`${d} min`}
                    badge={suggest30 && d === 30 && inputs.duration !== 30 ? 'SUGGESTED' : undefined}
                    selected={inputs.duration === d}
                    onPress={() => onDuration(d)}
                    testID={`v3-duration-${d}`}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        {error ? (
          <View style={styles.error} testID="v3-home-error">
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => build()} hitSlop={8}>
              <Text style={styles.retry}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* D. Build */}
      <View style={styles.footer} pointerEvents="box-none">
        <LinearGradient colors={['rgba(10,10,10,0)', COLORS.bg]} style={styles.footerFade as any} />
        <Text style={styles.summary} numberOfLines={1}>
          {summaryLine(inputs)}
        </Text>
        <Pressable onPress={() => build()} disabled={building || !!blocker} testID="v3-build" style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
          <LinearGradient
            colors={[...BRAND_GRADIENT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.cta, (building || !!blocker) && styles.ctaDim] as any}
          >
            {building ? (
              <View style={styles.ctaRow}>
                <ActivityIndicator color={COLORS.accentInk} />
                <Text style={styles.ctaText}>Building today's workout</Text>
              </View>
            ) : (
              <Text style={styles.ctaText}>{blocker ? 'Pick where you’re sore' : 'Build workout'}</Text>
            )}
          </LinearGradient>
        </Pressable>
        {building && buildingLine ? <Text style={styles.buildingLine}>{buildingLine}</Text> : null}
      </View>

      <ConflictSheet conflict={conflict} onSelect={onConflictOption} onClose={() => setConflict(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20 },
  eyebrow: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1.8, color: COLORS.textTertiary },
  h1: { fontSize: 34, lineHeight: 40, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.8, marginTop: 4 },
  h2: { fontSize: 19, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.2 },
  caption: { fontSize: 12.5, color: COLORS.textTertiary },
  section: { marginTop: 26 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stateCell: { flexGrow: 1, flexBasis: '30%' },

  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  todayEyebrow: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.6, color: COLORS.accent },
  todayTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 4 },
  todayMeta: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 2 },
  todayOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: COLORS.textPrimary,
  },
  todayOpenText: { fontSize: 13, fontWeight: '700', color: COLORS.accentInk },

  banner: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  bannerBody: { fontSize: 13, lineHeight: 19, color: COLORS.textSecondary, marginTop: 2 },

  sore: { marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)' },
  soreLabel: { fontSize: 13.5, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 10 },
  soreHint: { fontSize: 12.5, color: COLORS.textTertiary, marginTop: 10 },

  dirRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  dirCard: { flex: 1 },
  dirBorder: { flex: 1, borderRadius: 18, padding: 1.5 },
  dirBorderOff: { backgroundColor: 'rgba(255,255,255,0.1)' },
  dirInner: { flex: 1, borderRadius: 16.5, backgroundColor: '#121212', paddingHorizontal: 12, paddingTop: 14, paddingBottom: 12, minHeight: 112 },
  dirInnerOn: { backgroundColor: '#17150e' },
  dirName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginTop: 12 },
  dirNameOff: { color: 'rgba(255,255,255,0.85)' },
  dirDesc: { fontSize: 11.5, lineHeight: 15, color: COLORS.textTertiary, marginTop: 3 },

  panel: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  panelEmph: { borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)' },
  panelRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  panelLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.6, color: COLORS.textTertiary },
  panelValue: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 3 },
  change: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changeText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  pickCopy: { fontSize: 12.5, lineHeight: 18, color: COLORS.textTertiary, marginTop: -4, marginBottom: 12 },
  targets: { paddingBottom: 12 },
  targetHint: { fontSize: 12, color: COLORS.textTertiary, marginTop: 10 },
  hr: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.1)' },
  seg: { flexDirection: 'row', gap: 8 },
  suggest: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },

  error: {
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 19, color: COLORS.textSecondary },
  retry: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14, backgroundColor: COLORS.bg },
  footerFade: { position: 'absolute', left: 0, right: 0, top: -32, height: 32 },
  summary: { fontSize: 12.5, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center', marginBottom: 8 },
  cta: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  ctaDim: { opacity: 0.55 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ctaText: { fontSize: 17, fontWeight: '800', color: COLORS.accentInk, letterSpacing: 0.2 },
  buildingLine: { fontSize: 12, color: COLORS.textTertiary, textAlign: 'center', marginTop: 8 },
});
