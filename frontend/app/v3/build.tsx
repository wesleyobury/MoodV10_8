/**
 * V3 Build: /v3/build  (H1)
 *
 * The full generation flow, opened from the Home hero. Everything arrives preselected, so accepting the defaults is one
 * tap on Build Workout.
 *
 *   1. Direction   three image cards; default = last used Direction, else the Training Profile's default_direction
 *   2. State       carried from the Home hero (same day storage, editable here); Sore asks where
 *   3. Focus       MOOD's Pick by default; Change opens the Focus / Workout Type / Difficulty sheet
 *   4. Length      the time available (profile default_duration); the workout is built to fit inside it
 *   5. Build       POST /api/v3/workouts/generate -> Cart (/v3/workout), pushed on top (Back returns here)
 *
 * Moved here from the Phase 2.6 Home without changing the rules: State limits and Sore areas, Target vs Workout Type,
 * conflict options (ConflictSheet), request signatures and "same inputs, same day, same engine = reopen, don't rebuild".
 * Profile fields (goal, experience, frequency, equipment) are never asked: the server fills them.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { BRAND_GRADIENT, COLORS, bgA } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { trackEvent } from '../../utils/analytics';
import { FirstHomeHandoff, consumeFirstHomeHandoff, fetchTrainingProfile, readFirstHomeHandoff } from '../../utils/v3Profile';
import { V3Conflict, V3ConflictOption, V3Direction, V3Experience, V3State, generateV3Workout, getV3Version, localDateISO } from '../../utils/v3Api';
import {
  DIRECTIONS,
  DURATIONS,
  HomeInputs,
  MAX_STATES,
  SORE_REGIONS,
  STATES,
  applyConflictOption,
  buildBlocker,
  buildRequest,
  defaultDuration,
  focusSummary,
  initialInputs,
  moodsPickCopy,
  moodsPickRotation,
  BARRIER_BANNER,
  requestSignature,
  setArchetype,
  setDirection,
  setDuration,
  targetSupported,
  summaryLine,
  toggleSoreRegion,
  toggleState,
  V3Goal,
} from '../../utils/v3HomeModel';
import { clearDayStates, readDayStates, readLastDirection, readTodayBySignature, writeDayStates, writeLastDirection, writeToday } from '../../utils/v3Today';
import type { V3TodayEntry } from '../../utils/v3Today';
import { V3_HOME_HERO } from '../../utils/cartHero';
import { V3Chip } from '../../components/v3/V3Chip';
import { ConflictSheet } from '../../components/v3/ConflictSheet';
import { ConfigSheet } from '../../components/v3/ConfigSheet';
import { BodyMapSheet } from '../../components/v3/BodyMapSheet';
import { V3_ASSETS } from '../../components/v3/v3Images';
import { parseBuildPreset } from '../../utils/v3Explore';
import { PickRotator } from '../../components/v3/PickRotator';
import { BuildCoachmark } from '../../components/v3/BuildCoachmark';

const VALID_STATES = new Set<string>(STATES.map((s) => s.id));

function haptic() {
  Haptics.selectionAsync().catch(() => {});
}

export default function V3Build() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const uid = user?.id ?? null;
  /** Explore (Trending, MOOD's Picks) and Profile (Do Again) open Build with a preset: those inputs arrive preselected. */
  const { preset: presetParam, source: presetSource, first: firstParam } = useLocalSearchParams<{ preset?: string; source?: string; first?: string }>();
  /** Opened straight from the onboarding profile reveal ("Build my first workout"). */
  const fromOnboarding = firstParam === '1';
  /** First Build after onboarding: a one-time overlay pointing at Build Workout (BuildCoachmark). */
  const [coachmark, setCoachmark] = useState(false);
  const [footerH, setFooterH] = useState(0);

  const [inputs, setInputs] = useState<HomeInputs | null>(null);
  const [handoff, setHandoff] = useState<FirstHomeHandoff | null>(null);
  const [profileLevel, setProfileLevel] = useState<V3Experience | null>(null);
  const [profileGoal, setProfileGoal] = useState<V3Goal | null>(null);
  const [profileFreq, setProfileFreq] = useState<string | null>(null);
  const [engine, setEngine] = useState<{ engine_phase: string; engine_build: string } | null | undefined>(undefined);
  const [configOpen, setConfigOpen] = useState(false);
  const [building, setBuilding] = useState(false);
  const [conflict, setConflict] = useState<V3Conflict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stateHint, setStateHint] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const directionTouched = useRef(false);
  const durationTouched = useRef(false);
  /** "I'm steady today": picked on Home (no States, explicitly) or here; shown as a selected option under the six States. */
  const [steady, setSteady] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const track = useCallback(
    (name: string, meta: Record<string, any> = {}) => {
      if (token) trackEvent(token, name, { home_version: 'v3_h1', surface: 'build', ...meta });
    },
    [token],
  );

  /* ---------------------------------------------------------------- defaults */
  useEffect(() => {
    if (!uid) return;
    let alive = true;
    (async () => {
      const date = localDateISO();
      const [h, last, ds] = await Promise.all([readFirstHomeHandoff(uid), readLastDirection(uid), readDayStates(uid, date)]);
      if (!alive) return;
      const pending = h && h.pending ? h : null;
      const preset = parseBuildPreset(presetParam);
      // Opened by the onboarding reveal ("Build my first workout"): the funnel answers win over anything stored on this
      // device from earlier (a last-used Direction, today's States from a previous run / test account).
      const onboarding = fromOnboarding && !!pending && !preset;
      const prefill = (pending?.prefill?.states ?? []).filter((s) => VALID_STATES.has(s)) as V3State[];
      const dir: V3Direction = onboarding
        ? ((pending!.default_direction as V3Direction) ?? 'strength')
        : preset?.direction ?? last ?? (pending?.default_direction as V3Direction) ?? 'strength';
      if (onboarding) {
        directionTouched.current = true; // a late profile fetch must not move it
        setCoachmark(true);
      }
      // States: the onboarding prefill; otherwise today's Home selection, else the first-visit prefill.
      const states = onboarding ? prefill : preset?.states ?? (ds.set ? ds.states : prefill);
      if (onboarding) {
        if (prefill.length) writeDayStates(uid, { date, states: prefill, soreness: [], set: true });
        else clearDayStates(uid);
      }
      // Home's "I'm steady today" saves today's States as set-and-empty: arrive with Steady already selected
      setSteady(preset || onboarding ? false : ds.set && ds.states.length === 0);
      // First visit from onboarding: the "short on time" answer arrives as 30 min selected (changeable), not just a badge.
      const firstDuration = !preset && pending?.prefill?.suggest_duration === 30 && (onboarding || !ds.set) ? 30 : null;
      if (firstDuration) durationTouched.current = true;
      let base = initialInputs(dir, { states, duration: preset?.duration ?? firstDuration ?? defaultDuration(null, pending?.default_duration) });
      base = { ...base, soreness: !preset && !onboarding && states.includes('sore') ? ds.soreness : [] };
      if (preset) {
        // a preset is an explicit choice: profile defaults arriving later must not overwrite it
        directionTouched.current = true;
        if (preset.duration) durationTouched.current = true;
        if (preset.target && targetSupported(dir)) base = { ...base, target: preset.target, archetype: null };
        else if (preset.archetype) base = setArchetype(base, preset.archetype);
      }
      setInputs(base);
      const lvl = (pending?.profile as any)?.experience as V3Experience | undefined;
      if (lvl) setProfileLevel(lvl);
      const hg = (pending?.profile as any)?.goal as V3Goal | undefined;
      if (hg) setProfileGoal(hg);
      const hf = (pending?.profile as any)?.training_frequency as string | undefined;
      if (hf) setProfileFreq(hf);
      setHandoff(pending);
      track('v3_build_viewed', { direction: dir, direction_source: preset ? 'preset' : onboarding ? 'onboarding' : last ? 'last_used' : pending ? 'handoff' : 'fallback', states, first_visit: !!pending, preset_source: preset ? presetSource ?? null : null });
      if (!token) return;
      const prof = await fetchTrainingProfile(token);
      if (!alive || !prof) return;
      const pl = prof.profile?.experience as V3Experience | undefined;
      if (pl) setProfileLevel(pl);
      const pg = prof.profile?.goal as V3Goal | undefined;
      if (pg) setProfileGoal(pg);
      const pf = prof.profile?.training_frequency as string | undefined;
      if (pf) setProfileFreq(pf);
      const pd = defaultDuration(prof.profile?.default_duration as any, pending?.default_duration);
      setInputs((i) => {
        if (!i) return i;
        let next = i;
        if (!durationTouched.current) next = setDuration(next, pd);
        if (!last && prof.default_direction && !directionTouched.current) next = setDirection(next, prof.default_direction as V3Direction);
        return next;
      });
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => {
    let alive = true;
    getV3Version(token ?? null).then((v) => alive && setEngine(v));
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
  }, []);

  /** States / Sore areas edited here are today's States: Home shows them when the user comes back. */
  const persistStates = useCallback(
    (next: HomeInputs) => {
      if (!uid) return;
      writeDayStates(uid, { date: localDateISO(), states: next.states, soreness: next.soreness, set: true });
    },
    [uid],
  );

  /* ---------------------------------------------------------------- first-visit prefill */
  const suggest30 = !!handoff?.prefill?.suggest_duration;

  /* ---------------------------------------------------------------- input handlers */
  const onToggleState = (id: V3State) => {
    if (!inputs) return;
    const r = toggleState(inputs, id);
    if (r.limitHit) {
      if (hintTimer.current) clearTimeout(hintTimer.current);
      setStateHint(true);
      hintTimer.current = setTimeout(() => setStateHint(false), 2600);
      track('v3_state_limit_reached', { state: id });
      return;
    }
    haptic();
    // Sore opens the body map immediately (founder edit pass); it is kept only with at least one area.
    if (id === 'sore' && !inputs.states.includes('sore')) {
      track('v3_body_map_opened', { source: 'sore_chip' });
      setMapOpen(true);
      return;
    }
    setInputs(r.inputs);
    persistStates(r.inputs);
    setSteady(false);
    setError(null);
    track('v3_state_toggled', { state: id, selected: r.inputs.states.includes(id), count: r.inputs.states.length });
  };

  /** Steady = no States today, on purpose. Picking it clears the States (and any sore areas); a State clears it. */
  const onSteady = () => {
    if (!inputs) return;
    haptic();
    if (steady && inputs.states.length === 0) { setSteady(false); return; }
    const next = { ...inputs, states: [] as V3State[], soreness: [] as HomeInputs['soreness'] };
    setInputs(next);
    persistStates(next);
    setSteady(true);
    setError(null);
    track('v3_state_toggled', { state: 'steady', selected: true, count: 0 });
  };

  const onMapDone = (regions: HomeInputs['soreness']) => {
    setMapOpen(false);
    if (!inputs) return;
    const next = { ...inputs, states: inputs.states.includes('sore') ? inputs.states : [...inputs.states, 'sore' as V3State], soreness: regions };
    setInputs(next);
    persistStates(next);
    setError(null);
    track('v3_soreness_changed', { soreness: regions });
  };

  const onSore = (id: HomeInputs['soreness'][number]) => {
    if (!inputs) return;
    haptic();
    const next = toggleSoreRegion(inputs, id);
    setInputs(next);
    persistStates(next);
    track('v3_soreness_changed', { soreness: next.soreness });
  };

  const onDirection = (d: V3Direction) => {
    if (!inputs || d === inputs.direction) return;
    haptic();
    directionTouched.current = true;
    track('v3_direction_changed', { from: inputs.direction, to: d });
    setInputs(setDirection(inputs, d));
    setError(null);
  };

  const onDuration = (d: 30 | 60) => {
    if (!inputs || d === inputs.duration) return;
    haptic();
    durationTouched.current = true;
    track('v3_duration_changed', { duration: d, suggested: suggest30 && d === 30 });
    setInputs(setDuration(inputs, d));
  };

  const onConfig = (next: HomeInputs) => {
    setConfigOpen(false);
    if (!inputs) return;
    const changed = next.target !== inputs.target || next.archetype !== inputs.archetype || next.difficulty !== inputs.difficulty || (next.goal ?? null) !== (inputs.goal ?? null);
    setInputs(next);
    setError(null);
    if (!changed) return;
    track('v3_config_changed', { direction: next.direction, target: next.target, archetype: next.archetype, from_target: inputs.target, from_archetype: inputs.archetype });
    if (next.archetype !== inputs.archetype) {
      track('v3_archetype_changed', { direction: next.direction, from: inputs.archetype ?? 'moods_pick', to: next.archetype ?? 'moods_pick' });
    }
    if (next.difficulty !== inputs.difficulty) {
      track('v3_difficulty_changed', { direction: next.direction, from: inputs.difficulty ?? profileLevel ?? null, to: next.difficulty ?? profileLevel ?? null, override: !!next.difficulty });
    }
    if ((next.goal ?? null) !== (inputs.goal ?? null)) {
      track('v3_goal_changed', { direction: next.direction, from: inputs.goal ?? profileGoal ?? null, to: next.goal ?? profileGoal ?? null, override: !!next.goal });
    }
  };

  /* ---------------------------------------------------------------- build */
  // Pushed, not replaced (founder pass, Oct 2026): Back from the Cart returns to Build with every choice still set.
  const openCart = (id: string) => router.push({ pathname: '/v3/workout', params: { id } } as any);

  const build = async (override?: HomeInputs) => {
    const inp = override ?? inputs;
    if (!inp || !token || !uid || building) return;
    if (buildBlocker(inp)) return;
    const date = localDateISO();
    // The States a workout is built with are today's States (this also keeps a first-visit prefill once it is used).
    persistStates(inp);
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

    // Same inputs, same day, same engine: that workout already exists. Reopen it (never an older engine's build).
    const existing = await readTodayBySignature(uid, date, sig);
    if (existing && !!engine && existing.envelope.engine?.build === engine.engine_build) {
      await writeToday(uid, { ...existing, source: 'build' }); // it becomes the Home hero's workout again
      track('v3_workout_reopened', { workout_id: existing.workout_id, source: 'build_signature' });
      openCart(existing.workout_id);
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
    if (env.outcome === 'rerouted') track('v3_rerouted', { from: env.workout.requested_archetype?.id ?? null, to: env.workout.archetype.id });

    await writeLastDirection(uid, inp.direction);
    const entry: V3TodayEntry = {
      date,
      workout_id: env.workout.workout_id as string,
      signature: sig,
      request: req,
      envelope: env,
      saved_at: new Date().toISOString(),
      source: 'build',
    };
    await writeToday(uid, entry);
    // First successful generation ends the first-visit prefill for good.
    if (handoff) {
      await consumeFirstHomeHandoff(uid);
      setHandoff(null);
    }
    if (entry.workout_id) openCart(entry.workout_id);
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
    persistStates(r.inputs);
    build(r.inputs);
  };

  /* ---------------------------------------------------------------- render */
  const blocker = inputs ? buildBlocker(inputs) : null;
  const buildingLine = useMemo(() => (inputs ? summaryLine(inputs) : ''), [inputs]);

  if (!inputs) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  const pickCopy = !inputs.archetype && inputs.target === null ? moodsPickCopy(inputs.direction) : null;

  return (
    <View style={styles.root} testID="v3-build-screen">
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back} accessibilityLabel="Back" testID="v3-build-back">
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>{fromOnboarding ? 'Build your first workout' : 'Build today’s workout'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 150 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* 1. Direction */}
        <Text style={styles.step}>1</Text>
        <Text style={styles.h2}>What are we doing?</Text>
        <View style={styles.dirRow}>
          {DIRECTIONS.map((d) => {
            const on = inputs.direction === d.id;
            return (
              <Pressable
                key={d.id}
                onPress={() => onDirection(d.id)}
                style={({ pressed }) => [styles.dirCard, on ? styles.dirCardOn : styles.dirCardOff, pressed && { transform: [{ scale: 0.98 }] }]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                testID={`v3-direction-${d.id}`}
              >
                <ImageBackground source={V3_ASSETS[V3_HOME_HERO[d.id]]} resizeMode="cover" style={styles.dirImg} imageStyle={[styles.dirImgInner, !on && { opacity: 0.55 }]}>
                  <LinearGradient colors={['rgba(10,10,10,0)', 'rgba(10,10,10,0.92)']} locations={[0.25, 1]} style={StyleSheet.absoluteFillObject as any} />
                  {on ? (
                    <View style={styles.check}>
                      <Ionicons name="checkmark" size={13} color={COLORS.accentInk} />
                    </View>
                  ) : null}
                  <View style={styles.dirText}>
                    <Text style={[styles.dirName, !on && styles.dirNameOff]}>{d.name}</Text>
                    <Text style={styles.dirDesc} numberOfLines={2}>
                      {d.descriptor}
                    </Text>
                  </View>
                </ImageBackground>
              </Pressable>
            );
          })}
        </View>

        {/* 2. State */}
        <View style={styles.section}>
          <Text style={styles.step}>2</Text>
          <View style={styles.sectionHead}>
            <Text style={styles.h2}>How are you showing up?</Text>
            <Text style={styles.caption}>{stateHint ? `Up to ${MAX_STATES}` : 'Optional'}</Text>
          </View>
          <View style={styles.wrap}>
            {STATES.map((s) => (
              <V3Chip
                key={s.id}
                label={s.label}
                selected={inputs.states.includes(s.id)}
                muted={!inputs.states.includes(s.id) && inputs.states.length >= MAX_STATES}
                block
                style={styles.stateCell}
                onPress={() => onToggleState(s.id)}
                testID={`v3-state-${s.id}`}
              />
            ))}
          </View>
          {/* under the six States: the "nothing to adjust for" answer, prefilled when Home's "I'm steady today" opened Build */}
          {/* Selected reads as an answer already given (a gold check on a neutral row), not as a gold button still to press */}
          {(() => {
            const on = steady && inputs.states.length === 0;
            return (
              <Pressable
                onPress={onSteady}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={({ pressed }) => [styles.steadyRow, on && styles.steadyRowOn, pressed && { opacity: 0.85 }]}
                testID="v3-state-steady"
              >
                <View style={[styles.steadyMark, on && styles.steadyMarkOn]}>
                  <Ionicons name={on ? 'checkmark' : 'leaf-outline'} size={on ? 14 : 13} color={on ? COLORS.accentInk : '#FFE2A6'} />
                </View>
                <Text style={[styles.steadyLabel, on && styles.steadyLabelOn]}>I’m steady today</Text>
                <Text style={[styles.steadyNote, on && styles.steadyNoteOn]} testID={on ? 'v3-state-steady-on' : undefined}>{on ? 'Selected' : 'Nothing to adjust for'}</Text>
              </Pressable>
            );
          })()}
          {inputs.states.includes('sore') ? (
            <View style={styles.sore} testID="v3-soreness">
              <View style={styles.soreHead}>
                <Text style={styles.soreLabel}>Where you’re sore</Text>
                <Pressable onPress={() => setMapOpen(true)} hitSlop={8} testID="v3-build-body-map">
                  <Text style={styles.soreMap}>Body map</Text>
                </Pressable>
              </View>
              <View style={styles.wrap}>
                {inputs.soreness.map((r) => (
                  <V3Chip key={r} size="sm" label={SORE_REGIONS.find((x) => x.id === r)?.label ?? r} selected onPress={() => onSore(r)} testID={`v3-sore-${r}`} />
                ))}
              </View>
              {blocker === 'sore_needs_area' ? <Text style={styles.soreHint}>Pick at least one area so MOOD can work around it.</Text> : null}
            </View>
          ) : null}
        </View>

        {/* 3. Focus */}
        <View style={styles.section}>
          <Text style={styles.step}>3</Text>
          <Text style={styles.h2}>What do you want to hit?</Text>
          <Pressable
            onPress={() => setConfigOpen(true)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
            testID="v3-config"
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowValue} testID="v3-config-summary">
                {focusSummary(inputs)}
              </Text>
              {pickCopy ? <Text style={styles.rowSub}>{pickCopy}</Text> : null}
              {pickCopy ? (
                <PickRotator names={moodsPickRotation(inputs.direction, inputs.goal ?? profileGoal, profileFreq)} testID="v3-pick-rotator" />
              ) : null}
            </View>
            <Text style={styles.rowChange}>Change</Text>
          </Pressable>
        </View>

        {/* 4. Length */}
        <View style={styles.section}>
          <Text style={styles.step}>4</Text>
          <Text style={styles.h2}>Time available</Text>
          <View style={styles.lenRow}>
            {DURATIONS.map((d) => (
              <V3Chip
                key={d}
                label={`${d} min`}
                badge={suggest30 && d === 30 && inputs.duration !== 30 ? 'SUGGESTED' : undefined}
                selected={inputs.duration === d}
                block
                style={styles.lenCell}
                onPress={() => onDuration(d)}
                testID={`v3-length-${d}`}
              />
            ))}
          </View>
          <Text style={styles.caption}>MOOD builds a complete session that fits inside this window, so it can finish early.</Text>
        </View>

        {error ? (
          <View style={styles.error} testID="v3-build-error">
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => build()} hitSlop={8}>
              <Text style={styles.retry}>Try again</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* 5. Build */}
      {coachmark && footerH > 0 ? (
        <BuildCoachmark
          title={handoff?.prefill?.copy_key ? BARRIER_BANNER[handoff.prefill.copy_key].title : 'You’re all set'}
          body={(() => {
            const k = handoff?.prefill?.copy_key;
            if (!k) return 'Your answers are already in. Tap Build Workout to see your first session.';
            // dont_know / motivation copy already says "press Build"
            return k === 'dont_know' || k === 'motivation' ? BARRIER_BANNER[k].body : `${BARRIER_BANNER[k].body} Tap Build Workout when you're ready.`;
          })()}
          footerHeight={footerH}
          onDismiss={() => { setCoachmark(false); track('v3_build_coachmark_dismissed', { via: 'tap' }); }}
        />
      ) : null}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]} pointerEvents="box-none" onLayout={(e) => setFooterH(e.nativeEvent.layout.height)}>
        <LinearGradient colors={[bgA(0), COLORS.bg]} style={styles.footerFade as any} />
        <Text style={styles.summary} numberOfLines={1} testID="v3-build-summary">
          {buildingLine}
        </Text>
        <Pressable onPress={() => { if (coachmark) { setCoachmark(false); track('v3_build_coachmark_dismissed', { via: 'build' }); } build(); }} disabled={building || !!blocker} testID="v3-build" style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
          <LinearGradient
            colors={blocker ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.08)'] : [...BRAND_GRADIENT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.cta, building && styles.ctaDim, blocker && styles.ctaBlocked] as any}
          >
            {building ? (
              <View style={styles.ctaRow}>
                <ActivityIndicator color={COLORS.accentInk} />
                <Text style={styles.ctaText}>Building today’s workout</Text>
              </View>
            ) : (
              <Text style={[styles.ctaText, blocker && styles.ctaTextBlocked]}>{blocker ? 'Pick where you’re sore' : 'Build Workout'}</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      <BodyMapSheet visible={mapOpen} initial={inputs.soreness} onDone={onMapDone} onCancel={() => setMapOpen(false)} />
      <ConflictSheet conflict={conflict} onSelect={onConflictOption} onClose={() => setConflict(null)} />
      <ConfigSheet
        visible={configOpen}
        inputs={inputs}
        suggest30={suggest30}
        profileLevel={profileLevel}
        profileGoal={profileGoal}
        showLength={false}
        onApply={onConfig}
        onClose={() => setConfigOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: { paddingHorizontal: 12, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  scroll: { paddingHorizontal: 20, paddingTop: 10 },

  step: { fontSize: 11, fontWeight: '800', letterSpacing: 1.6, color: COLORS.textTertiary, marginBottom: 2 },
  h2: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  caption: { fontSize: 12.5, lineHeight: 18, color: COLORS.textTertiary, marginTop: 10 },
  section: { marginTop: 30 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stateCell: { flexGrow: 1, flexBasis: '30%' },
  steadyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 22, backgroundColor: '#6E6158', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,245,230,0.24)' },
  steadyRowOn: { backgroundColor: '#8E7F74', borderColor: 'rgba(255,245,230,0.5)', borderWidth: 1 },
  steadyMark: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,245,230,0.14)' },
  steadyMarkOn: { backgroundColor: COLORS.accent },
  steadyLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  steadyLabelOn: { fontWeight: '700' },
  steadyNoteOn: { color: COLORS.textPrimary },
  steadyNote: { fontSize: 12.5, fontWeight: '600', color: COLORS.textSecondary },

  dirRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  dirCard: { flex: 1, borderRadius: 18, overflow: 'hidden' },
  dirCardOn: { borderWidth: 2, borderColor: COLORS.textPrimary },
  dirCardOff: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)' },
  dirImg: { height: 168, justifyContent: 'flex-end', backgroundColor: COLORS.surface },
  dirImgInner: { borderRadius: 16, width: '100%', height: '100%' },
  check: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
  },
  dirText: { paddingHorizontal: 11, paddingBottom: 11 },
  dirName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  dirNameOff: { color: 'rgba(255,255,255,0.8)' },
  dirDesc: { fontSize: 11, lineHeight: 14, color: 'rgba(255,255,255,0.62)', marginTop: 2 },

  sore: { marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)' },
  soreHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  soreMap: { fontSize: 13.5, fontWeight: '700', color: COLORS.accent },
  soreLabel: { fontSize: 13.5, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 10 },
  soreHint: { fontSize: 12.5, color: COLORS.textTertiary, marginTop: 10 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  rowValue: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  rowSub: { fontSize: 12.5, lineHeight: 18, color: COLORS.textTertiary, marginTop: 4 },
  rowChange: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
  lenRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  lenCell: { flex: 1 },

  error: { marginTop: 20, padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', alignItems: 'center', gap: 12 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 19, color: COLORS.textSecondary },
  retry: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 6, backgroundColor: COLORS.bg },
  footerFade: { position: 'absolute', left: 0, right: 0, top: -32, height: 32 },
  summary: { fontSize: 12.5, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center', marginBottom: 8 },
  cta: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  ctaDim: { opacity: 0.92 },
  // Never a dimmed gold (reads as the banned flat mustard): a blocked CTA is a neutral surface with light text.
  ctaBlocked: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.16)' },
  ctaTextBlocked: { color: COLORS.textSecondary },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ctaText: { fontSize: 17, fontWeight: '800', color: COLORS.accentInk, letterSpacing: 0.2 },
});
