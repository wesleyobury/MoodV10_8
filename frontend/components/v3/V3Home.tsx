/**
 * V3Home: Today's Workout (Phase 2.6 hierarchy).
 *
 * "Onboarding tells MOOD who you are as an athlete. Home tells MOOD how you are today." Home answers one question:
 * what happens if I tap Build?
 *
 *   A. How are you feeling?   optional States (max 3) + sore areas
 *   B. What are we doing?     Strength / Sweat / Athletic (one always selected)
 *   C. One compact row        "MOOD's Pick · 60 min"  Change  (Focus / Workout Type / Length live in ConfigSheet)
 *   D. Build workout          POST /api/v3/workouts/generate -> Workout Preview
 *
 * Default path: optional State -> Direction -> Build. First visit only: the barrier prefill, shown as a one-line hint.
 * Today's workout is reopened only when it was built with the same inputs by the engine that is running now.
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
  EXPECTED_ENGINE_PHASE,
  V3Direction,
  V3Experience,
  V3State,
  generateV3Workout,
  getV3Version,
  localDateISO,
} from '../../utils/v3Api';
import {
  BARRIER_BANNER,
  BarrierKey,
  DIRECTIONS,
  HomeInputs,
  MAX_STATES,
  SORE_REGIONS,
  STATES,
  STATE_LABEL,
  applyConflictOption,
  buildBlocker,
  buildRequest,
  configSummary,
  initialInputs,
  moodsPickCopy,
  requestSignature,
  setDirection,
  summaryLine,
  toggleSoreRegion,
  toggleState,
} from '../../utils/v3HomeModel';
import { V3TodayEntry, readLastDirection, readToday, writeLastDirection, writeToday } from '../../utils/v3Today';
import { V3Chip } from './V3Chip';
import { ConflictSheet } from './ConflictSheet';
import { ConfigSheet } from './ConfigSheet';
import { previewMeta, previewTitle } from '../../utils/v3PreviewFormat';

declare const __DEV__: boolean;

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
  const [configOpen, setConfigOpen] = useState(false);
  /** training_profile.experience: today's default Difficulty. */
  const [profileLevel, setProfileLevel] = useState<V3Experience | null>(null);
  /** "Build a different workout" tucks Today's Workout into one line so Home is about the new build. */
  const [todayTucked, setTodayTucked] = useState(false);
  const [stateHint, setStateHint] = useState(false);
  /** Engine identity of the running backend (GET /api/v3/version). null = unknown / unreachable. */
  const [engine, setEngine] = useState<{ engine_phase: string; engine_build: string } | null | undefined>(undefined);
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
      const handoffLevel = (pending?.profile as any)?.experience as V3Experience | undefined;
      if (handoffLevel) setProfileLevel(handoffLevel);
      setHandoff(pending);
      setToday(t);
      track('v3_home_viewed', {
        first_visit: !!pending,
        barrier: pending?.profile?.biggest_barrier ?? null,
        default_direction: dir,
        direction_source: last ? 'last_used' : pending ? 'handoff' : 'fallback',
        has_today_workout: !!t,
      });
      if (token) {
        // Always read the profile: Difficulty defaults to its experience (Direction only when there is no last-used one).
        const prof = await fetchTrainingProfile(token);
        if (!alive) return;
        const lvl = prof?.profile?.experience as V3Experience | undefined;
        if (lvl) setProfileLevel(lvl);
        const d = prof?.default_direction;
        if (!last && d && !directionTouched.current) setInputs((i) => (i ? { ...i, direction: d } : i));
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

  // Which engine is the backend running? Used to never reopen a workout an older engine built, and (dev builds) to
  // flag a backend process that is still running old code.
  useEffect(() => {
    let alive = true;
    getV3Version(token ?? null).then((v) => {
      if (!alive) return;
      setEngine(v);
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        // eslint-disable-next-line no-console
        console.log(`[v3] backend engine ${v ? `${v.engine_phase}/${v.engine_build} started ${v.started_at}` : 'UNKNOWN (no /api/v3/version: old backend process?)'}`);
      }
    });
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
  }, []);

  const flashHint = () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    setStateHint(true);
    hintTimer.current = setTimeout(() => setStateHint(false), 2600);
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
      flashHint();
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

  const onConfig = (next: HomeInputs) => {
    setConfigOpen(false);
    if (!inputs) return;
    const changed =
      next.target !== inputs.target || next.archetype !== inputs.archetype || next.duration !== inputs.duration || next.difficulty !== inputs.difficulty;
    setInputs(next);
    setError(null);
    if (changed) {
      track('v3_config_changed', {
        direction: next.direction,
        target: next.target,
        archetype: next.archetype,
        duration: next.duration,
        from_target: inputs.target,
        from_archetype: inputs.archetype,
        from_duration: inputs.duration,
      });
      if (next.archetype !== inputs.archetype) {
        track('v3_archetype_changed', { surface: 'home', direction: next.direction, from: inputs.archetype ?? 'moods_pick', to: next.archetype ?? 'moods_pick' });
      }
      if (next.difficulty !== inputs.difficulty) {
        track('v3_difficulty_changed', { direction: next.direction, from: inputs.difficulty ?? profileLevel ?? null, to: next.difficulty ?? profileLevel ?? null, profile: profileLevel, override: !!next.difficulty });
      }
      if (next.duration !== inputs.duration) track('v3_duration_changed', { duration: next.duration, suggested: suggest30 && next.duration === 30 });
    }
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
      difficulty: req.experience ?? profileLevel ?? null,
      difficulty_override: !!req.experience,
      moods_pick: moodsPick,
      archetype: req.archetype ?? null,
      first_visit: !!handoff,
    });
    if (moodsPick) track('v3_moods_pick_used', { direction: req.direction });

    // Same inputs, same day, same engine: the workout already exists. Reopen it. A workout built by another engine
    // (e.g. before a backend update or while an old process was running) is never passed off as a fresh build.
    const sameEngine = !!engine && today?.envelope.engine?.build === engine.engine_build;
    if (today && today.signature === sig && sameEngine) {
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
    setTodayTucked(false);
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
      setConfigOpen(true);
      return;
    }
    setInputs(r.inputs);
    build(r.inputs);
  };

  /* ---------------------------------------------------------------- render */
  const blocker = inputs ? buildBlocker(inputs) : null;
  // Today's workout is only offered when the running engine built it (never an older engine's cached output).
  const todayCurrent = !!today && !!engine && today.envelope.engine?.build === engine.engine_build;
  const staleBackend = typeof __DEV__ !== 'undefined' && __DEV__ && engine !== undefined && (!engine || engine.engine_phase !== EXPECTED_ENGINE_PHASE);
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
        {/* Today's Workout: an already-built workout for today (not a generation preference). */}
        {todayCurrent && today?.envelope.workout ? (
          todayTucked ? (
            <Pressable
              onPress={() => {
                track('v3_workout_reopened', { workout_id: today.workout_id, source: 'today_line' });
                openWorkout(today.workout_id);
              }}
              style={styles.todayLine}
              testID="v3-today-line"
            >
              <Text style={styles.todayLineText} numberOfLines={1}>
                Today's workout: {previewTitle(today.envelope.workout)}
              </Text>
              <Text style={styles.todayLineLink}>View</Text>
            </Pressable>
          ) : (
            <View style={styles.todayCard} testID="v3-today-card">
              <Text style={styles.todayEyebrow}>TODAY'S WORKOUT</Text>
              <Text style={styles.todayTitle}>
                {today.envelope.workout.direction_name} · {previewTitle(today.envelope.workout)}
              </Text>
              <Text style={styles.todayMeta}>{previewMeta(today.envelope.workout)}</Text>
              <Pressable
                onPress={() => {
                  track('v3_workout_reopened', { workout_id: today.workout_id, source: 'today_card' });
                  openWorkout(today.workout_id);
                }}
                style={({ pressed }) => [styles.todayView, pressed && { opacity: 0.85 }]}
                testID="v3-today-view"
              >
                <Text style={styles.todayViewText}>View Workout</Text>
                <Ionicons name="chevron-forward" size={15} color={COLORS.accentInk} />
              </Pressable>
              <Pressable
                onPress={() => {
                  track('v3_build_different_tapped', { workout_id: today.workout_id });
                  setTodayTucked(true);
                }}
                hitSlop={8}
                style={styles.todayAlt}
                testID="v3-today-build-different"
              >
                <Text style={styles.todayAltText}>Build a different workout</Text>
              </Pressable>
            </View>
          )
        ) : null}

        {staleBackend ? (
          <View style={styles.devWarn} testID="v3-dev-stale-backend">
            <Text style={styles.devWarnText}>
              DEV: backend is not running engine {EXPECTED_ENGINE_PHASE} ({engine ? `it reports ${engine.engine_phase}` : 'no /api/v3/version'}). Restart uvicorn, then reload the app.
            </Text>
          </View>
        ) : null}

        {/* First-visit barrier prefill: a starting suggestion, not another setting */}
        {banner ? (
          <View style={styles.hintRow} testID="v3-prefill-banner">
            <Ionicons name="sparkles" size={13} color={COLORS.accent} />
            <Text style={styles.hintText}>
              <Text style={styles.hintStrong}>{banner.title}. </Text>
              {banner.body}
            </Text>
            <Pressable onPress={dismissPrefill} hitSlop={10} accessibilityLabel="Dismiss" testID="v3-prefill-dismiss">
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.45)" />
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

        {/* C. One compact configuration row */}
        <Pressable
          onPress={() => setConfigOpen(true)}
          style={({ pressed }) => [styles.config, emphasizePick && styles.configEmph, pressed && { opacity: 0.85 }]}
          testID="v3-config"
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.configValue} testID="v3-config-summary">
              {configSummary(inputs)}
            </Text>
            {emphasizePick && !inputs.archetype && inputs.target === null ? <Text style={styles.configSub}>{moodsPickCopy(inputs.direction)}</Text> : null}
            {suggest30 && inputs.duration === 60 ? <Text style={styles.configSub}>Short on time? 30 min is one tap away.</Text> : null}
          </View>
          <Text style={styles.configChange}>Change</Text>
        </Pressable>

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
      <ConfigSheet visible={configOpen} inputs={inputs} suggest30={suggest30} profileLevel={profileLevel} onApply={onConfig} onClose={() => setConfigOpen(false)} />
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
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  todayEyebrow: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.6, color: COLORS.accent },
  todayTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginTop: 5 },
  todayMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  todayView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 14,
    height: 44,
    borderRadius: 13,
    backgroundColor: COLORS.textPrimary,
  },
  todayViewText: { fontSize: 15, fontWeight: '800', color: COLORS.accentInk },
  todayAlt: { alignSelf: 'center', marginTop: 12, paddingVertical: 2 },
  todayAltText: { fontSize: 13.5, fontWeight: '600', color: COLORS.textSecondary },
  todayLine: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  todayLineText: { flex: 1, fontSize: 13.5, color: COLORS.textSecondary },
  todayLineLink: { fontSize: 13.5, fontWeight: '700', color: COLORS.accent },

  hintRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 14 },
  hintText: { flex: 1, fontSize: 13, lineHeight: 19, color: COLORS.textSecondary },
  hintStrong: { color: COLORS.textPrimary, fontWeight: '700' },
  devWarn: { marginTop: 12, padding: 10, borderRadius: 10, backgroundColor: 'rgba(255,69,58,0.14)', borderWidth: 1, borderColor: 'rgba(255,69,58,0.5)' },
  devWarnText: { fontSize: 12, lineHeight: 17, color: '#ff8a80', fontWeight: '600' },

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

  config: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 22,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  configEmph: { borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)' },
  configValue: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  configSub: { fontSize: 12.5, lineHeight: 18, color: COLORS.textTertiary, marginTop: 4 },
  configChange: { fontSize: 14, fontWeight: '700', color: COLORS.accent },

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
