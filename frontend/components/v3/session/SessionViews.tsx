/**
 * Guided Session presentation (founder review pass). One screen per exercise, not per step:
 *
 *   Hero        full-bleed exercise photo (the library thumbnail, uncropped as far as the screen allows) with the block role,
 *               muscles and exercise name over its bottom edge; the top bar floats over it
 *   Where       one strip that always answers "where am I": one segment per block, Set 2 of 4 dots, what's left
 *   Stage       the one thing to do now: the big target (work), the rest ring inside the same exercise screen (rest /
 *               transition: no separate rest screen), the phase ring for clock blocks
 *   ready       the block before its clock starts: format from the rest contract, exercises, Start
 *   checklist   warm-up / cool-down guidance (+ the Athletic warm-up list), no invented timers
 *   finish      Finish workout (explicit), or why it can't be finished yet
 */
import React, { useState } from 'react';
import { Animated, Easing, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../../SafeLinearGradient';
import { BRAND_GRADIENT, COLORS, HERO_FADE_COLORS, HERO_FADE_LOCATIONS, bgA } from '../../../constants/brand';
import type { V3Item } from '../../../utils/v3Api';
import { exerciseImageUrl } from '../../../utils/v3ExerciseImages';
import { Image as CachedImage } from 'expo-image';
import { optimizedImageUrl } from '../../../utils/cloudinaryImage';
import { hasVideo } from '../../../utils/v3OverviewFormat';
import { fmtClock } from '../../../utils/v3Session/compile';
import type { Position, WhereAmI } from '../../../utils/v3Session/coach';
import type { SessionMode } from '../../../utils/v3Session/record';
import type { StepView } from '../../../utils/v3Session/viewModel';
import { clockSummary, edgePlan } from '../../../utils/v3Session/viewModel';
import type { SessionPlan } from '../../../utils/v3Session/types';
import { ExerciseThumb } from '../ExerciseThumb';
import { TimerRing } from './TimerRing';

export const PHASE_COLOR: Record<string, string> = {
  work: COLORS.accent,
  steady: COLORS.accent,
  easy: '#6CC7F5',
  // every rest is the same gold timer (founder review 6); EASY stays blue because it is part of an interval, not a rest
  round_rest: COLORS.accent,
  emom_rest: '#6CC7F5',
  rest: COLORS.accent,
  full: COLORS.accent,
  move: COLORS.accent,
  none: '#FFFFFF',
};

/* ------------------------------------------------------------------ frame */

/** Floats over the hero: exit, (Overview: overall progress), the labelled mode switch. Position lives in WhereStrip. */
export function TopBar(props: {
  pos: Position;
  mode: SessionMode;
  onMode: (m: SessionMode) => void;
  paused: boolean;
  topInset: number;
  onExit: () => void;
  /** Overview shows completion across the whole workout */
  overall?: { done: number; total: number } | null;
  /** true when the bar floats over a hero photo (a scrim keeps it legible) */
  overlay?: boolean;
}) {
  const bar = (
    <View style={[styles.top, { paddingTop: props.topInset + 6 }]}>
      <View style={styles.topRow}>
        <Pressable onPress={props.onExit} hitSlop={12} style={styles.round} accessibilityLabel="Exit workout" testID="v3-session-exit">
          <Ionicons name="close" size={20} color={COLORS.textPrimary} />
        </Pressable>
        <View style={styles.topMid}>
          {props.mode === 'overview' && props.overall ? (
            <Text style={styles.topLocal} numberOfLines={1} testID="v3-session-overall">{`${props.overall.done} of ${props.overall.total} done`}</Text>
          ) : props.paused ? (
            <Text style={styles.topLocal} testID="v3-session-paused">PAUSED</Text>
          ) : null}
        </View>
        <ModeToggle mode={props.mode} onMode={props.onMode} />
      </View>
    </View>
  );
  if (!props.overlay) return bar;
  return (
    <View style={styles.topOverlay} pointerEvents="box-none">
      {/* no scrim of its own: the photo carries a light veil under the bar (founder review 6i: no black fade at the top) */}
      {bar}
    </View>
  );
}

/**
 * One round button, the same size and glass as the close button (founder review 6j: the two-part Guided | Overview pill sat
 * over the photo). It shows where it takes you: a list in Guided (open Overview), a play / guide arrow in Overview (back to
 * Guided). Switching never changes the workout or its progress.
 */
export function ModeToggle({ mode, onMode }: { mode: SessionMode; onMode: (m: SessionMode) => void }) {
  const to: SessionMode = mode === 'guided' ? 'overview' : 'guided';
  return (
    <Pressable
      onPress={() => onMode(to)}
      hitSlop={12}
      style={({ pressed }) => [styles.round, pressed && { opacity: 0.75 }]}
      accessibilityRole="button"
      accessibilityLabel={to === 'overview' ? 'Switch to Overview: the whole workout' : 'Switch to Guided: MOOD coaches every step'}
      testID={`v3-session-mode-${to}`}
    >
      <View testID="v3-session-mode" accessibilityElementsHidden>
        <Ionicons name={to === 'overview' ? 'list' : 'navigate'} size={18} color={COLORS.textPrimary} />
      </View>
    </Pressable>
  );
}

/** Always visible under the hero: one segment per block, the local unit, and what is left. */
export function WhereStrip({ where }: { where: WhereAmI }) {
  // one row (founder review 6, to give the photo the height): Set 2 of 4 ●●○○ on the left, the block segments filling the rest
  return (
    <View style={styles.where} testID="v3-session-where">
      <View style={styles.whereOne}>
        <View style={styles.localRow}>
          {where.local ? <Text style={styles.topLocal} numberOfLines={1} testID="v3-session-local">{where.local}</Text> : null}
          {where.dots && where.dots.total <= 12 ? (
            <View style={styles.dots} accessibilityLabel={`${where.dots.done} of ${where.dots.total} done`}>
              {Array.from({ length: where.dots.total }, (_, i) => (
                <View key={i} style={[styles.dot, i < where.dots!.done && styles.dotDone, i === where.dots!.done && styles.dotNow]} />
              ))}
            </View>
          ) : null}
        </View>
        {where.segments.length ? (
          <View style={styles.segments} accessibilityLabel={where.block ? `Block ${where.block.n} of ${where.block.of}` : undefined}>
            {where.segments.map((sg) => (
              <View key={sg.key} style={[styles.segment, sg.current && styles.segmentCurrent]}>
                <View style={[styles.segmentFill, { width: `${Math.round(sg.done * 100)}%` }]} />
              </View>
            ))}
          </View>
        ) : <View style={{ flex: 1 }} />}
        {where.block ? <Text style={styles.blockNo} testID="v3-session-blockno">{`${where.block.n}/${where.block.of}`}</Text> : null}
      </View>
    </View>
  );
}

/** Layer 2 coaching: one line, quiet, only when the moment earns it. */
export function CoachLine({ line, center }: { line: StepView['coach']; center?: boolean }) {
  if (!line) return null;
  return (
    <View style={[styles.coach, center && { alignSelf: 'center' }]} testID={`v3-session-coach-${line.kind}`}>
      <Ionicons name={line.kind === 'structure' ? 'school-outline' : 'chatbubble-ellipses-outline'} size={13} color={COLORS.accent} style={{ marginTop: 3 }} />
      <Text style={[styles.coachText, center && { textAlign: 'center' }]}>{line.text}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ hero */

/**
 * The exercise photo (founder review 6c). The 4:5 library image starts just under the status bar, so heads are never behind
 * the notch or cut off, and is shown at full width, as tall as the screen allows (a sliver of floor is the only thing that
 * may go, and only on small phones). The role · muscles, the exercise name and the Where row (Set 2 of 4 · block segments)
 * sit over the bottom of the photo on a dark fade, so everything below the photo is the set itself.
 */
export function heroGeometry(width: number, height: number, topInset: number) {
  const imgH = Math.round(width * 1.25);
  const photoTop = topInset + 4;
  const boxH = Math.round(Math.min(imgH, height * 0.57 - photoTop));
  return { imgH, photoTop, boxH, total: photoTop + boxH };
}

export function Hero(props: {
  item: V3Item | null;
  where: WhereAmI;
  topInset: number;
  onDetails: () => void;
  /** "UP NEXT" when the photo is the next exercise (a transition or a clock recovery) */
  tag?: string | null;
  /** the exercise name to show when there is no item (section title) */
  fallbackTitle?: string | null;
}) {
  const { width, height } = useWindowDimensions();
  const [failed, setFailed] = useState<string | null>(null);
  const it = props.item;
  const raw = it ? exerciseImageUrl(it) : null;
  const uri = raw && failed !== raw ? optimizedImageUrl(raw, 1080) : null;
  const video = it ? hasVideo(it) : false;
  const g = heroGeometry(width, height, props.topInset);
  const line1 = [props.where.role, props.where.muscles?.toUpperCase()].filter(Boolean).join(' · ');
  const title = it?.exercise.name ?? props.fallbackTitle ?? '';
  const info = (
    <View style={styles.heroText}>
      <View style={styles.eyebrowRow}>
        {props.tag === 'UP NEXT' ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{props.tag}</Text>
          </View>
        ) : null}
        <Text style={styles.eyebrow} numberOfLines={1} testID="v3-session-block">{line1}</Text>
        {video ? (
          <Pressable onPress={props.onDetails} style={styles.demoChip} hitSlop={8} testID="v3-session-demo">
            <Ionicons name="play" size={11} color={COLORS.textPrimary} />
            <Text style={styles.demoText}>Demo</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable onPress={props.onDetails} style={styles.nameRow} hitSlop={6} accessibilityHint="Exercise details" testID="v3-session-name">
        <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{title}</Text>
      </Pressable>
      <WhereStrip where={props.where} />
    </View>
  );
  if (!uri) {
    return (
      <View style={{ paddingTop: props.topInset + 56 }} testID="v3-session-hero-text">
        {info}
      </View>
    );
  }
  return (
    <View style={{ height: g.total, backgroundColor: COLORS.bg }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: g.photoTop, height: g.boxH, overflow: 'hidden' }} testID="v3-session-media">
        <Image source={{ uri }} style={{ position: 'absolute', left: 0, top: 0, width, height: g.imgH }} resizeMode="cover" onError={() => setFailed(raw)} />
        <LinearGradient colors={HERO_FADE_COLORS} locations={HERO_FADE_LOCATIONS.map((l) => 0.55 + l * 0.45) as any} style={StyleSheet.absoluteFill as any} />
      </View>
      <View style={styles.heroOverlay} pointerEvents="box-none">{info}</View>
    </View>
  );
}

/**
 * Superset / circuit, unmistakable (founder review 6c): a card under the photo that names the format and the round, lists
 * every exercise of the round with its target (the one in hand lit, the ones done ticked) and says in one sentence how to
 * do it. Neutral surface, gold only as marks.
 */
export function GroupCard({ group }: { group: NonNullable<WhereAmI['group']> }) {
  const label = group.kind === 'superset' ? 'SUPERSET' : group.kind === 'hybrid' ? 'ANCHOR CIRCUIT' : group.kind === 'emom' ? 'EMOM' : 'CIRCUIT';
  // EMOM, circuits and anchor circuits (founder pass, Oct 2026): one line by default (round + the station in hand); the
  // station list drops down on tap. Supersets keep their two rows open.
  const foldable = group.kind === 'emom' || group.kind === 'circuit' || group.kind === 'hybrid';
  const [open, setOpen] = useState(false);
  const shown = !foldable || open;
  // one job per line (founder pass, Oct 2026): the eyebrow says the format and the station, the meta line the target, this
  // card the round. It is the only place the round is shown.
  const rounds = group.round && group.rounds && group.rounds > 1 ? { n: group.round, of: group.rounds } : null;
  const unit = group.kind === 'superset' ? 'exercises' : 'stations';
  return (
    <View style={styles.groupCard} testID="v3-session-group" accessibilityLabel={`${label}${group.round ? `, round ${group.round} of ${group.rounds}` : ''}: ${group.items.map((g) => `${g.marker} ${g.name}${g.done ? ' done' : g.active ? ' now' : ''}`).join(', ')}. ${group.how}`}>
      <Pressable
        disabled={!foldable}
        onPress={() => setOpen((x) => !x)}
        hitSlop={6}
        style={[styles.groupHead, !shown && { marginBottom: 2 }]}
        accessibilityRole={foldable ? 'button' : undefined}
        accessibilityState={foldable ? { expanded: open } : undefined}
        accessibilityHint={foldable ? (open ? 'Hide the stations' : 'Show every station') : undefined}
        testID="v3-session-group-head"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <Text style={styles.groupRoundBig} testID="v3-session-group-round">{rounds ? `Round ${rounds.n} of ${rounds.of}` : `${group.items.length} ${unit}`}</Text>
          {rounds && rounds.of <= 12 ? (
            <View style={styles.dots}>
              {Array.from({ length: rounds.of }, (_, i) => (
                <View key={i} style={[styles.dot, i < rounds.n - 1 && styles.dotDone, i === rounds.n - 1 && styles.dotNow]} />
              ))}
            </View>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {foldable ? <Text style={styles.groupRound}>{open ? 'Hide' : `All ${group.items.length} ${unit}`}</Text> : null}
          {foldable ? <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color={COLORS.textSecondary} /> : null}
        </View>
      </Pressable>
      {shown && group.items.map((g, i) => (
        <View key={g.marker + i} style={[styles.groupItem, g.active && styles.groupItemOn]} testID={g.active ? 'v3-session-group-now' : undefined}>
          <View style={[styles.groupMarkerBox, g.active && styles.groupMarkerBoxOn, g.done && !g.active && styles.groupMarkerBoxDone]}>
            {g.done && !g.active ? <Ionicons name="checkmark" size={13} color={COLORS.accent} /> : <Text style={[styles.groupMarker, g.active && { color: COLORS.accentInk }]}>{g.marker}</Text>}
          </View>
          <Text style={[styles.groupName, g.active && styles.groupNameOn, g.done && !g.active && { opacity: 0.55 }]} numberOfLines={1}>{g.name}</Text>
          {g.rx ? <Text style={[styles.groupRx, g.active && { color: COLORS.textPrimary }]} numberOfLines={1}>{g.rx}</Text> : null}
          {g.active ? <Text style={styles.groupNow}>NOW</Text> : null}
        </View>
      ))}
      {/* how it works: said in round 1; later rounds the lit row is enough */}
      {shown && (!group.round || group.round <= 1) && group.items[0]?.active ? <Text style={styles.groupHow} testID="v3-session-group-how">{group.how}</Text> : null}
    </View>
  );
}

/* ------------------------------------------------------------------ the exercise screen (work + its rest) */

/**
 * One screen per exercise (founder review 6): the hero and the Where strip stay put while the athlete works and rests; only
 * the guidance area flips between the set (target, effort, two cues, Log weight) and the rest timer (gold ring, what is
 * next). Completing a set no longer rebuilds the screen, so nothing flashes.
 */
export function ExerciseScreen(props: {
  v: StepView;
  plan: SessionPlan;
  /** 'work': the set; 'rest': the rest / transition before the next set of focus */
  stage: 'work' | 'rest';
  /** the exercise the screen is about (the set's exercise, or the next one during a rest) */
  focus: V3Item | null;
  topInset: number;
  onDetails: () => void;
  /** tap on the effort chip ("2 RIR") or the set-method chip ("1.5 reps"): what it means */
  onExplain: (title: string, body: string) => void;
  logger: React.ReactNode;
  /** −15 / +15 / +30 on the rest timer, beside it */
  onAddTime?: (s: -30 | -15 | 15 | 30) => void;
}) {
  const { v, stage } = props;
  const newExercise = stage === 'rest' && !!props.focus && v.item?.item_id !== props.focus.item_id;
  const target = stage === 'work' ? v.target : v.upNext?.target ?? null;
  return (
    <View style={{ flex: 1 }}>
      <PhotoHero item={props.focus} topInset={props.topInset}>
        <ExerciseHeader v={v} plan={props.plan} focus={props.focus} target={target} live={stage === 'work'} upNext={newExercise} onDetails={props.onDetails} />
      </PhotoHero>
      <View style={styles.page}>
        {v.where.group ? <GroupCard group={v.where.group} /> : null}
        <SetRow v={v} onExplain={props.onExplain} showChips={stage === 'work'} />
        <Flip flipKey={stage}>
          {stage === 'work' ? <WorkStage v={v} onExplain={props.onExplain} logger={props.logger} /> : <RestStage v={v} onAddTime={props.onAddTime} newExercise={newExercise} />}
        </Flip>
      </View>
    </View>
  );
}

/** "Exercise 3 / 7": the focus exercise's place among all the workout's exercises (block items, in order). */
export function exerciseNumber(plan: SessionPlan, itemId: string | null | undefined): { n: number; of: number } | null {
  const ids = plan.sections.filter((x) => x.kind === 'block').flatMap((x) => x.items.map((it) => it.item_id));
  const i = itemId ? ids.indexOf(itemId) : -1;
  return i >= 0 ? { n: i + 1, of: ids.length } : null;
}

/**
 * The top of the Guided screen (founder review 6e): WORKOUT PROGRESS (one segment per block, n / N), then EXERCISE n / N ·
 * role, the exercise name (up to two lines), and "3 sets • 8–10 reps". The photo sits below all of it, uncropped.
 */
/** Hero title size by length (two lines max): "Burpee" stays big, "Single-Arm Dumbbell Overhead Press" steps down. */
function titleSize(t: string) {
  const n = t.length;
  return n > 30 ? { fontSize: 24, lineHeight: 28 } : n > 22 ? { fontSize: 27, lineHeight: 31 } : null;
}

export function ExerciseHeader(props: { v: StepView; plan: SessionPlan; focus: V3Item | null; target: string | null; live: boolean; upNext?: boolean; onDetails: () => void; meta?: string | null; eyebrow?: string | null }) {
  const { v, plan, focus } = props;
  const where = v.where;
  const num = exerciseNumber(plan, focus?.item_id);
  const sec = focus ? plan.sections.find((x) => x.kind === 'block' && x.items.some((it) => it.item_id === focus.item_id)) ?? v.section : v.section;
  const grouped = !!sec && sec.items.length > 1 && sec.restKind !== 'between_sets';
  // grouped work (superset / circuit / hybrid / EMOM): the eyebrow places the exercise inside its group; the round lives on the
  // group card below, so it is not repeated here (founder pass, Oct 2026)
  const g = where.group;
  const gi = g && focus ? g.items.findIndex((x) => x.name === focus.exercise.name) : -1;
  const groupEyebrow = props.eyebrow ?? (g && gi >= 0
    ? `${g.kind === 'superset' ? 'SUPERSET' : g.kind === 'hybrid' ? 'ANCHOR CIRCUIT' : g.kind === 'emom' ? 'EMOM' : 'CIRCUIT'}  ·  ${g.kind === 'superset' ? g.items[gi].marker : g.items[gi].marker === 'ANCHOR' ? 'ANCHOR' : `STATION ${gi + 1} OF ${g.items.length}`}`
    : null);
  // "4 sets" is not repeated when the set row below already says "Set 2 of 4 ●●●●"
  const count = where.local && where.dots ? null : grouped ? sec?.rounds ?? null : focus?.prescription.sets ?? sec?.rounds ?? null;
  const meta = props.eyebrow ? props.meta ?? '' : groupEyebrow ? props.target ?? '' : props.meta ?? [count ? `${count} ${grouped ? (count === 1 ? 'round' : 'rounds') : count === 1 ? 'set' : 'sets'}` : null, props.target].filter(Boolean).join('  •  ');
  const video = focus ? hasVideo(focus) : false;
  const title = focus?.exercise.name ?? v.upNext?.title ?? v.section.title;
  return (
    <View style={styles.header} testID="v3-session-header">
      {where.segments.length ? (
        <View style={{ marginBottom: 14 }} testID="v3-session-where">
          <Text style={styles.progressLabel}>WORKOUT PROGRESS</Text>
          <View style={styles.progressRow}>
            <View style={styles.segments} accessibilityLabel={where.block ? `Block ${where.block.n} of ${where.block.of}` : undefined}>
              {where.segments.map((sg) => (
                <View key={sg.key} style={[styles.segment, sg.current && styles.segmentCurrent]}>
                  <View style={[styles.segmentFill, { width: `${Math.round(sg.done * 100)}%` }]} />
                </View>
              ))}
            </View>
            {where.block && where.block.of > 1 ? <Text style={styles.blockNo} testID="v3-session-blockno">{`Block ${where.block.n} of ${where.block.of}`}</Text> : null}
          </View>
        </View>
      ) : null}
      <View style={styles.eyebrowRow}>
        <Text style={styles.exEyebrow} numberOfLines={1} testID="v3-session-block">
          {props.upNext ? <Text style={styles.exEyebrowNext}>UP NEXT  ·  </Text> : null}
          {groupEyebrow ? <Text style={styles.exEyebrowNum} testID="v3-session-group-kind">{groupEyebrow}</Text> : num ? <>EXERCISE <Text style={styles.exEyebrowNum}>{num.n}</Text>{` / ${num.of}`}</> : where.role}
          {!groupEyebrow && num && where.role ? <Text style={styles.exEyebrowRole}>{`  ·  ${where.role}`}</Text> : null}
        </Text>
        {video ? (
          <Pressable onPress={props.onDetails} style={styles.demoChip} hitSlop={8} testID="v3-session-demo">
            <Ionicons name="play" size={11} color={COLORS.textPrimary} />
            <Text style={styles.demoText}>Demo</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable onPress={props.onDetails} hitSlop={6} accessibilityHint="Exercise details" testID="v3-session-name">
        {/* no adjustsFontSizeToFit: on iOS it can measure to nothing while the photo swaps and the title vanishes; size by length */}
        <Text style={[styles.exTitle, titleSize(title)]} numberOfLines={2} testID="v3-session-title">{title}</Text>
      </Pressable>
      {meta ? (
        <Text style={styles.exMeta} numberOfLines={1}>
          {props.live && props.target && (!props.meta || (groupEyebrow && !props.eyebrow)) ? (
            <>
              {meta.slice(0, meta.length - props.target.length)}
              <Text testID="v3-session-target">{props.target}</Text>
            </>
          ) : meta}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * The exercise photo, never cropped (founder review 6e): the 4:5 library image is fitted inside whatever height the screen
 * leaves (contain), centred, and its top, bottom and (when narrower than the screen) sides fade slightly into the black.
 */
export function FitPhoto({ item, minHeight = 160 }: { item: V3Item | null; minHeight?: number }) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const raw = item ? exerciseImageUrl(item) : null;
  const uri = raw && failed !== raw ? optimizedImageUrl(raw, 1080) : null;
  if (!uri) return <View style={{ flex: 1, minHeight: 24 }} />;
  const fitH = box ? Math.min(box.h, box.w * 1.25) : 0;
  const fitW = Math.round(fitH * 0.8);
  const fade = Math.round(fitH * 0.1);
  const narrower = box ? fitW < box.w - 2 : false;
  return (
    <View style={{ flex: 1, minHeight, alignItems: 'center', justifyContent: 'center' }} onLayout={(e) => setBox({ w: Math.round(e.nativeEvent.layout.width), h: Math.round(e.nativeEvent.layout.height) })} testID="v3-session-media">
      {box && fitH > 0 ? (
        <View style={{ width: fitW, height: fitH }}>
          <Image source={{ uri }} style={{ width: fitW, height: fitH }} resizeMode="contain" onError={() => setFailed(raw)} />
          <LinearGradient colors={[COLORS.bg, bgA(0)]} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: fade } as any} />
          <LinearGradient colors={[bgA(0), COLORS.bg]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: fade } as any} />
          {narrower ? (
            <>
              <LinearGradient colors={[COLORS.bg, bgA(0)]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: Math.round(fitW * 0.12) } as any} />
              <LinearGradient colors={[bgA(0), COLORS.bg]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: Math.round(fitW * 0.12) } as any} />
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/**
 * The Guided photo, Cart-style (founder review 6f): edge to edge, starting right under the status bar (the same place the
 * Cart hero starts), the 4:5 library image laid out at full width and anchored to its TOP so heads are never cut. It takes
 * the height the screen leaves (flex); the header (progress, exercise, name, sets · reps) sits over its lower part on a fade
 * into the black, and the close / mode bar floats over its top.
 */
export function PhotoHero({ item, topInset, children, minHeight = 260 }: { item: V3Item | null; topInset: number; children: React.ReactNode; minHeight?: number }) {
  const { width } = useWindowDimensions();
  const raw = item ? exerciseImageUrl(item) : null;
  const uri = raw ? optimizedImageUrl(raw, 1080) : null;
  return (
    <View style={{ flex: 1, minHeight }}>
      {/* the photo runs to the very top of the screen (behind the status bar): see HeroPhotoLayer */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden', backgroundColor: COLORS.bg }} testID={uri ? 'v3-session-media' : 'v3-session-hero-text'}>
        <HeroPhotoLayer uri={uri} width={width} topInset={topInset} />
      </View>
      <View style={{ flex: 1 }} />
      <HeaderFade fadeKey={item?.item_id ?? ''}>{children}</HeaderFade>
    </View>
  );
}

/**
 * The photo itself, memoised on (uri, width): the session re-renders every tick and on every Complete set, but this layer
 * only re-renders when the exercise changes, at a fixed size (no re-decode on layout), with a stable source object, and it
 * never hides itself on a load error (a cancelled request on iOS used to blank the hero until the next exercise).
 * expo-image keeps the previous photo until the next one is decoded, then cross-dissolves.
 */
const HeroPhotoLayer = React.memo(function HeroPhotoLayer({ uri, width, topInset }: { uri: string | null; width: number; topInset: number }) {
  // founder review 6i: no black fade at the top. The photo keeps its bottom exactly where it was (topInset + the 4:5 height
  // at full width) and grows upward to the very top of the screen; to keep 4:5 it is scaled up a touch and centred, so only a
  // sliver of each side goes (about 18 pt per side on a 390 pt phone). Nothing is cut at the top or the bottom.
  const imgH = Math.round(width * 1.25) + topInset;
  const imgW = Math.round(imgH * 0.8);
  const left = Math.round((width - imgW) / 2);
  const source = React.useMemo(() => (uri ? { uri } : null), [uri]);
  return (
    <>
      {source ? (
        <CachedImage
          source={source}
          style={{ position: 'absolute', left, top: 0, width: imgW, height: imgH }}
          contentFit="cover"
          contentPosition="top"
          cachePolicy="memory-disk"
          priority="high"
          transition={{ duration: 200, effect: 'cross-dissolve' }}
        />
      ) : null}
      {/* a light veil under the status bar and the close / mode bar, for legibility only (not a fade to black) */}
      <LinearGradient colors={['rgba(12,12,13,0.38)', 'rgba(12,12,13,0)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: topInset + 70 } as any} />
      <LinearGradient colors={HERO_FADE_COLORS} locations={HERO_FADE_LOCATIONS.map((l) => 0.3 + l * 0.7) as any} style={StyleSheet.absoluteFill as any} />
      {/* a box taller than the photo (large phones): the photo's own bottom edge fades out too */}
      <LinearGradient colors={[bgA(0), COLORS.bg]} style={{ position: 'absolute', left: 0, right: 0, top: imgH - 60, height: 60 } as any} />
    </>
  );
});

/** The header over the photo changes with the photo (same 200 ms dissolve), so the words never flip ahead of the picture. */
function HeaderFade({ fadeKey, children }: { fadeKey: string; children: React.ReactNode }) {
  const o = React.useRef(new Animated.Value(1)).current;
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    o.setValue(0.15);
    Animated.timing(o, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [fadeKey, o]);
  return <Animated.View style={[styles.heroOverlayFlow, { opacity: o }]}>{children}</Animated.View>;
}

/** Under the photo: Set 2 of 4 ●●○○ (or Round 2 of 3), with the effort / method chips on the right. */
function SetRow({ v, onExplain, showChips }: { v: StepView; onExplain: (title: string, body: string) => void; showChips: boolean }) {
  const where = v.where;
  return (
    <View style={[styles.setRow, where.group && { justifyContent: 'flex-start' }]}>
      <View style={[styles.localRow, where.group && { flex: 0 }]}>
        {where.local && !where.group ? <Text style={styles.topLocal} numberOfLines={1} testID="v3-session-local">{where.local}</Text> : null}
        {where.dots && where.dots.total <= 12 && !where.group ? (
          <View style={styles.dots} accessibilityLabel={`${where.dots.done} of ${where.dots.total} done`}>
            {Array.from({ length: where.dots.total }, (_, i) => (
              <View key={i} style={[styles.dot, i < where.dots!.done && styles.dotDone, i === where.dots!.done && styles.dotNow]} />
            ))}
          </View>
        ) : null}
      </View>
      {showChips ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {v.method ? (
            <Pressable onPress={() => onExplain(v.method!.title, v.method!.body)} hitSlop={8} style={[styles.chip, styles.chipMethod]} accessibilityRole="button" accessibilityLabel={`${v.method.label}: what it means`} testID="v3-session-method">
              <Text style={[styles.chipText, { color: COLORS.accentInk }]}>{v.method.label}</Text>
            </Pressable>
          ) : null}
          {v.effortChip ? (
            <Pressable onPress={() => onExplain(v.effortChip!.title, v.effortChip!.body)} hitSlop={8} style={styles.chip} accessibilityRole="button" accessibilityLabel={`${v.effortChip.label}: what it means`} testID="v3-session-effort">
              <Text style={styles.chipText}>{v.effortChip.label}</Text>
              <Ionicons name="information-circle-outline" size={13} color={COLORS.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** The guidance area turns over (a quick vertical flip) when it changes between the set and the rest timer. */
function Flip({ flipKey, children }: { flipKey: string; children: React.ReactNode }) {
  const t = React.useRef(new Animated.Value(1)).current;
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    t.setValue(0);
    Animated.timing(t, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [flipKey, t]);
  // a quick dissolve with a small lift (no 3D perspective: a rotateX layer on iOS can flash the screen while it rasterises)
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }} testID={`v3-session-stage-${flipKey}`}>
      {children}
    </Animated.View>
  );
}

function WorkStage({ v, onExplain, logger }: { v: StepView; onExplain: (title: string, body: string) => void; logger: React.ReactNode }) {
  const moving = !!v.transitionToWork;
  const holdRunning = !moving && v.step.durationSec && v.timer?.running;
  return (
    <View>
      {moving && v.timer ? (
        <View style={styles.moveLine} testID="v3-session-move">
          <Ionicons name="walk-outline" size={14} color={PHASE_COLOR.move} />
          <Text style={styles.moveText}>{`Move straight over · ${fmtClock(v.timer.remainingMs)}`}</Text>
        </View>
      ) : null}
      {v.step.side ? <Text style={styles.side} testID="v3-session-position">{v.step.side === 'left' ? 'LEFT SIDE' : 'RIGHT SIDE'}</Text> : null}
      {holdRunning ? (
        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <TimerRing remainingMs={v.timer!.remainingMs} totalMs={v.timer!.totalMs} color={COLORS.accent} size={150} sublabel={v.target} />
        </View>
      ) : null}
      {/* two coaching cues, chosen for this set (first: setup + form, middle: form + efficiency, last: what breaks down) */}
      {v.cues.length && !v.where.group ? (
        <View style={styles.cues} testID="v3-session-cues">
          {(v.where.group ? [] : v.cues).map((c, i) => (
            <View key={i} style={styles.cueRow}>
              <View style={styles.cueDot} />
              <Text style={styles.cue} numberOfLines={2}>{c}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {logger}
    </View>
  );
}

/** The rest inside the exercise screen: the same gold timer for every Direction, and what comes next. */
function RestStage({ v, onAddTime, newExercise }: { v: StepView; onAddTime?: (s: -30 | -15 | 15 | 30) => void; newExercise: boolean }) {
  const then = v.upNext ? [v.upNext.item && v.upNext.item.item_id === v.focusItem?.item_id ? v.where.local : v.upNext.title, v.upNext.target].filter(Boolean).join(' · ') : null;
  return (
    <View style={styles.restRow} testID="v3-session-up-next">
      {v.timer ? <TimerRing remainingMs={v.timer.remainingMs} totalMs={v.timer.totalMs} color={COLORS.accent} size={v.where.group ? 86 : 120} label={v.phase === 'move' ? 'MOVE' : 'REST'} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.restEyebrow} testID="v3-session-rest-phase">{v.phase === 'full' ? 'FULL RECOVERY' : newExercise ? 'NEXT EXERCISE' : 'NEXT'}</Text>
        {then ? <Text style={styles.then} numberOfLines={2} testID="v3-session-then">{then}</Text> : null}
        {v.restCue && !v.where.group ? <Text style={styles.restCue} numberOfLines={3} testID="v3-session-rest-cue">{v.restCue}</Text> : null}
        {onAddTime && v.canAddTime ? (
          <View style={styles.timePills} testID="v3-session-time-pills">
            <Pill label="−15s" onPress={() => onAddTime(-15)} testID="v3-session-time-minus15" />
            <Pill label="+15s" onPress={() => onAddTime(15)} testID="v3-session-time-plus15" />
            <Pill label="+30s" onPress={() => onAddTime(30)} testID="v3-session-time-plus30" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function UpNextCard({ up, onPress }: { up: NonNullable<StepView['upNext']>; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.upNext} testID="v3-session-up-next">
      {up.item ? <ExerciseThumb item={up.item} size={52} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.upEyebrow}>{`UP NEXT · ${up.eyebrow}`}</Text>
        <Text style={styles.upTitle} numberOfLines={2}>{up.title}</Text>
        {up.target ? <Text style={styles.upTarget}>{up.target}</Text> : null}
        {up.qualityStop ? <Text style={styles.upQs} numberOfLines={2}>{up.qualityStop}</Text> : null}
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ clock blocks */

/** Clock blocks: the same exercise screen; the phase ring is the stage. During EASY the photo already shows the next station. */
export function ClockBody({ v, plan, topInset, onDetails, paused, onPause, onResume, onAddTime }: { v: StepView; plan: SessionPlan; topInset: number; onDetails: () => void; paused?: boolean; onPause?: () => void; onResume?: () => void; onAddTime?: (s: 15 | 30) => void }) {
  // EMOM: the 15 s switch between minutes (founder pass, Oct 2026): next station on screen, the minute starts by itself
  const emomSwitch = v.step.type === 'transition' && v.step.labels.phase === 'Switch';
  const { width } = useWindowDimensions();
  const color = PHASE_COLOR[v.phase];
  const size = Math.min(150, width - 200);
  const working = (v.phase === 'work' || v.phase === 'steady') && !v.emomDoneEarly;
  const focus = working ? v.item : v.upNext?.item ?? v.item;
  const upNext = !working && !!focus && focus.item_id !== v.item?.item_id;
  return (
    <View style={{ flex: 1 }}>
      <PhotoHero item={focus} topInset={topInset}>
        <ExerciseHeader v={v} plan={plan} focus={focus} target={working ? v.target : v.upNext?.target ?? v.target} live={working} upNext={upNext} onDetails={onDetails} meta={clockSummary(v.section) || null} />
      </PhotoHero>
      <View style={styles.page}>
        {v.where.group ? <GroupCard group={v.where.group} /> : null}
        <View style={styles.restRow}>
          {v.timer ? <TimerRing remainingMs={v.timer.remainingMs} totalMs={v.timer.totalMs} color={color} size={size} dim={!working || !v.timer.running} /> : null}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.restEyebrow, { color }]} testID="v3-session-phase">{v.phaseLabel}</Text>
            {/* the clock's own position (Minute 7 of 24, Interval 3 of 8); a round is on the group card, not repeated here */}
            {v.where.local && !(v.where.group && /^Round /.test(v.where.local)) ? <Text style={styles.clockTarget} testID="v3-session-local">{v.where.local}</Text> : null}
            {working && v.target && !v.where.group ? <Text style={styles.then}>{v.target}</Text> : null}
            {v.emomDoneEarly ? <Text style={styles.emomSub}>until the next minute</Text> : null}
            {emomSwitch ? (
              <>
                <View style={styles.timePills} testID="v3-session-switch-pills">
                  {onPause && onResume ? <Pill label={paused ? 'Resume' : 'Pause'} onPress={paused ? onResume : onPause} testID="v3-session-switch-pause" /> : null}
                  {onAddTime && !paused ? <Pill label="+15s" onPress={() => onAddTime(15)} testID="v3-session-switch-plus15" /> : null}
                </View>
              </>
            ) : !working && v.upNext && !upNext ? <Text style={styles.restCue} testID="v3-session-up-next">{`then ${v.upNext.title}${v.upNext.target ? ` · ${v.upNext.target}` : ''}`}</Text> : null}
          </View>
        </View>
        <CoachLine line={v.coach} />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ ready / checklist / finish */

export function ReadyBody({ v, plan, topInset, onDetails }: { v: StepView; plan: SessionPlan; topInset: number; onDetails: () => void }) {
  const sec = v.section;
  const firstRound = plan.steps.filter((x) => x.section === sec.index && (x.type === 'timed_work' || x.type === 'emom_minute')).slice(0, Math.max(1, sec.items.length));
  // rounds up front (founder pass, Oct 2026): a multi-station clock block repeats its list; say how many times before it starts
  const emom = sec.restKind === 'emom';
  const minutes = emom ? sec.interval?.minutes ?? (sec.rounds ?? 1) * Math.max(1, sec.items.length) : null;
  const rounds = sec.items.length > 1 ? (emom ? Math.ceil(minutes! / sec.items.length) : sec.structure === 'timed_circuit' ? sec.rounds ?? null : null) : null;
  const showRounds = !!rounds && rounds > 1;
  return (
    <View>
      <View style={{ height: topInset + 400 }}>
        <PhotoHero item={sec.items[0] ?? null} topInset={topInset}>
          <ExerciseHeader v={v} plan={plan} focus={sec.items[0] ?? null} target={null} live={false} upNext onDetails={onDetails} meta={showRounds ? null : emom ? `EMOM · ${minutes} min` : sec.title} eyebrow={showRounds ? (emom ? 'EMOM' : 'TIMED CIRCUIT') : null} />
        </PhotoHero>
      </View>
      <View style={styles.page}>
      {showRounds ? (
        <View style={styles.roundsCard} testID="v3-session-ready-rounds">
          <View style={styles.roundsBig}>
            <Text style={styles.roundsNum}>{rounds}</Text>
            <Text style={styles.roundsWord}>ROUNDS</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.roundsHead} testID="v3-session-ready-format">{emom ? `${sec.items.length} stations, one per minute` : `${sec.items.length} stations on the clock`}</Text>
            <Text style={styles.roundsSub}>{emom ? `${minutes} min total` : clockSummary(sec).replace(/^\d+ rounds · /, '')}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.readyFormat} testID="v3-session-ready-format">{clockSummary(sec)}</Text>
      )}
      {showRounds ? <Text style={styles.roundsListLabel}>EACH ROUND</Text> : null}
      <View style={{ marginTop: showRounds ? 10 : 16, gap: 10 }}>
        {sec.items.map((it, i) => (
          <View key={`${it.item_id}-${i}`} style={styles.readyRow}>
            {showRounds ? <Text style={styles.readyMarker}>{i + 1}</Text> : null}
            <ExerciseThumb item={it} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.readyName}>{it.exercise.name}</Text>
              <Text style={styles.readyMeta}>{firstRound.find((x) => x.itemIndex === i)?.target?.text ?? it.prescription.display}</Text>
            </View>
          </View>
        ))}
      </View>
      <CoachLine line={v.coach} />
      {sec.guidance && !emom ? <Text style={styles.guidance}>{sec.guidance}</Text> : null}
      <Text style={styles.readyNote}>The clock runs on its own once you start. Pause any time.</Text>
      </View>
    </View>
  );
}

/**
 * Warm-up / cool-down (founder review 6c: it must never look like the workout itself). A clearly labelled prep screen: a
 * WARM-UP badge with "Doesn't count toward your sets", "Warm up first" and what it prepares you for, then the steps as a
 * numbered checklist on a timeline (no cards), each ticked by tapping its number; a step shows its exercise photo when it
 * has one (founder review 6d). Rows come from
 * the section (edgePlan): Athletic's own list, or the guidance sentence read into cardio · mobility · ramp-up sets.
 */
export function ChecklistBody({ v, plan, topInset, onDetails }: { v: StepView; plan: SessionPlan; topInset: number; onDetails: (item: V3Item) => void }) {
  const sec = v.section;
  const ep = edgePlan(plan, sec);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const first = plan.sections.find((x) => x.kind === 'block')?.items[0] ?? null;
  const warm = sec.kind === 'warmup';
  const done = ep.rows.filter((r) => checked[r.key]).length;
  return (
    <View style={[styles.page, { paddingTop: topInset + 64 }]} testID={warm ? 'v3-session-warmup' : 'v3-session-cooldown'}>
      <View style={styles.prepHead}>
        <View style={styles.prepBadge}>
          <Ionicons name={warm ? 'flame' : 'leaf'} size={13} color={COLORS.accent} />
          <Text style={styles.prepBadgeText}>{warm ? 'WARM-UP' : 'COOL-DOWN'}</Text>
        </View>
        <Text style={styles.prepMeta}>{[ep.minutes ? `${ep.minutes} min` : null, "Doesn't count toward your sets"].filter(Boolean).join(' · ')}</Text>
      </View>
      <Text style={styles.prepTitle}>{warm ? 'Warm up first' : 'Bring it down'}</Text>
      {warm && first ? <Text style={styles.edgeLead}>{`Gets you ready for ${first.exercise.name}. Your workout starts after this.`}</Text> : null}
      <View style={{ marginTop: 18 }}>
        {ep.rows.map((r, i) => {
          const on = !!checked[r.key];
          const last = i === ep.rows.length - 1;
          return (
            <View key={r.key} style={styles.stepRow}>
              <View style={styles.stepRail}>
                <Pressable onPress={() => setChecked((c) => ({ ...c, [r.key]: !c[r.key] }))} hitSlop={10} style={[styles.stepNum, on && styles.stepNumOn]} testID={`v3-session-warmup-${r.key}`} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`${r.name ?? r.label}${on ? ', done' : ''}`}>
                  {on ? <Ionicons name="checkmark" size={15} color={COLORS.accentInk} /> : <Text style={styles.stepNumText}>{i + 1}</Text>}
                </Pressable>
                {!last ? <View style={styles.stepLine} /> : null}
              </View>
              {r.item && exerciseImageUrl(r.item) ? (
                // the exercise photo when the warm-up item has one (Athletic's list, the ramp-up lift); tap for details
                <Pressable onPress={() => (r.item!.item_id.startsWith('warmup-') ? setChecked((c) => ({ ...c, [r.key]: !c[r.key] })) : onDetails(r.item!))} hitSlop={4} style={[styles.stepThumb, on && { opacity: 0.55 }]} testID={`v3-session-warmup-thumb-${r.key}`}>
                  <ExerciseThumb item={r.item} size={52} />
                </Pressable>
              ) : null}
              <Pressable onPress={() => setChecked((c) => ({ ...c, [r.key]: !c[r.key] }))} style={[styles.stepBody, r.item && exerciseImageUrl(r.item) ? { paddingLeft: 10 } : null, last && { paddingBottom: 0 }, on && { opacity: 0.55 }]}>
                <View style={styles.edgeHead}>
                  <Text style={[styles.readyName, styles.edgeName]}>{r.name ?? r.label}</Text>
                  {r.rx ? <Text style={styles.edgeRx}>{r.rx}</Text> : null}
                </View>
                {r.name ? <Text style={styles.readyMeta}>{r.label}</Text> : null}
                {r.note ? <Text style={styles.readyMeta}>{r.note}</Text> : null}
                {r.choice && warm ? <Text style={styles.edgeChoice}>Your choice of machine</Text> : null}
              </Pressable>
            </View>
          );
        })}
      </View>
      {ep.rows.length ? <Text style={styles.prepProgress} testID="v3-session-warmup-progress">{`${done} of ${ep.rows.length} done · tap a number to tick it off`}</Text> : null}
      {ep.fallback ? <Text style={[styles.guidance, { fontSize: 17, lineHeight: 25, color: COLORS.textPrimary }]}>{ep.fallback}</Text> : null}
      {ep.choiceNote ? (
        <View style={styles.edgeNote} testID="v3-session-warmup-choice">
          <Ionicons name="information-circle-outline" size={15} color={COLORS.textTertiary} style={{ marginTop: 2 }} />
          <Text style={styles.edgeNoteText}>{ep.choiceNote}</Text>
        </View>
      ) : null}
      {sec.kind === 'cooldown' && sec.guidance && !ep.rows.length ? <Text style={styles.guidance}>{sec.guidance}</Text> : null}
    </View>
  );
}

export function FinishBody({ canFinish, topInset }: { canFinish: boolean; topInset: number }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: topInset + 90, paddingHorizontal: 20 }}>
      <View style={styles.finishIcon}>
        <Ionicons name={canFinish ? 'flag' : 'hourglass-outline'} size={30} color={COLORS.accentInk} />
      </View>
      <Text style={[styles.name, { textAlign: 'center', marginTop: 18 }]}>{canFinish ? "That's the workout." : 'Nothing logged yet'}</Text>
      <Text style={[styles.guidance, { textAlign: 'center' }]}>
        {canFinish ? 'Tap Finish to save it to MOOD.' : 'Finish needs at least one completed set. Go back to train, or end the workout.'}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ bottom actions */

export function Actions(props: {
  v: StepView;
  paused: boolean;
  canFinish: boolean;
  bottomInset: number;
  onPrimary: () => void;
  onSkip: () => void;
  /** "All sets done": the athlete finished this exercise's remaining sets on their own */
  onAllSets?: (() => void) | null;
  onAddTime: (s: -30 | -15 | 15 | 30) => void;
  onBack: (() => void) | null;
  onMore: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}) {
  const { v } = props;
  const t = v.step.type;
  const isClock = t === 'timed_work' || t === 'recovery' || t === 'emom_minute';
  const timerRunning = !!v.timer?.running;
  let primary = v.primary;
  if (t === 'finish' && !props.canFinish) primary = null;
  return (
    <View style={[styles.actions, { paddingBottom: props.bottomInset + 12 }]}>
      {v.nextLine && t !== 'work' && t !== 'emom_minute' && t !== 'finish' && t !== 'ready' && t !== 'checklist' && primary !== 'Finish workout' && !(v.upNext && (t === 'rest' || t === 'transition' || t === 'recovery' || v.emomDoneEarly)) ? <Text style={styles.nextLine} numberOfLines={1} testID="v3-session-next">{v.nextLine}</Text> : null}
      {props.paused ? (
        <Primary label="Resume" icon="play" onPress={props.onResume} testID="v3-session-resume" />
      ) : primary && props.onAllSets && v.allDone && (!timerRunning || !!v.transitionToWork) ? (
        <View style={styles.dual}>
          <View style={{ flex: 1 }}><Primary label={primary} onPress={props.onPrimary} testID="v3-session-primary" /></View>
          <Pressable onPress={props.onAllSets} style={({ pressed }) => [styles.subtleBtn, styles.dualRight, pressed && { opacity: 0.8 }]} accessibilityRole="button" testID="v3-session-all-sets">
            <Text style={styles.subtleText}>All sets done</Text>
          </Pressable>
        </View>
      ) : primary ? (
        <Primary label={primary} onPress={props.onPrimary} testID="v3-session-primary" />
      ) : null}
      {t === 'finish' && !props.canFinish ? <Secondary label="End workout" onPress={props.onEnd} /> : null}
      {!props.paused ? (
        <View style={styles.secondaryRow}>
          {props.onBack ? <Link label="Back" icon="arrow-undo-outline" onPress={props.onBack} /> : <View />}
          <View style={{ flexDirection: 'row', gap: 18 }}>
            {timerRunning ? <Link label="Pause" icon="pause" onPress={props.onPause} testID="v3-session-pause" /> : null}
            {isClock && !primary ? <Link label="Skip" icon="play-skip-forward-outline" onPress={props.onSkip} /> : t !== 'finish' && !isClock ? <Link label="More" icon="ellipsis-horizontal" onPress={props.onMore} /> : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Primary({ label, onPress, icon, testID, subtle }: { label: string; onPress: () => void; icon?: any; testID?: string; subtle?: boolean }) {
  if (subtle) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.subtleBtn, pressed && { opacity: 0.8 }]} testID={testID}>
        <Text style={styles.subtleText}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]} testID={testID} accessibilityRole="button">
      <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primary as any}>
        {icon ? <Ionicons name={icon} size={18} color={COLORS.accentInk} /> : null}
        <Text style={styles.primaryText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function Secondary({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.subtleBtn, { marginTop: 10 }, pressed && { opacity: 0.8 }]}>
      <Text style={styles.subtleText}>{label}</Text>
    </Pressable>
  );
}

function Link({ label, icon, onPress, testID }: { label: string; icon: any; onPress: () => void; testID?: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.link} testID={testID ?? `v3-session-${label.toLowerCase()}`}>
      <Ionicons name={icon} size={15} color={COLORS.textTertiary} />
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

function Pill({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.pill, pressed && { opacity: 0.7 }]} testID={testID}>
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ sheets */

export function ActionSheet(props: {
  visible: boolean;
  title: string;
  message?: string | null;
  options: { label: string; onPress: () => void; tone?: 'primary' | 'danger' | 'plain'; testID?: string }[];
  onClose: () => void;
  bottomInset: number;
}) {
  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      <Pressable style={styles.scrim} onPress={props.onClose} />
      <View style={[styles.sheet, { paddingBottom: props.bottomInset + 16 }]}>
        <Text style={styles.sheetTitle}>{props.title}</Text>
        {props.message ? <Text style={styles.sheetMsg}>{props.message}</Text> : null}
        <View style={{ gap: 10, marginTop: 16 }}>
          {props.options.map((o) =>
            o.tone === 'primary' ? (
              <Primary key={o.label} label={o.label} onPress={o.onPress} testID={o.testID} />
            ) : (
              <Pressable key={o.label} onPress={o.onPress} style={({ pressed }) => [styles.subtleBtn, pressed && { opacity: 0.8 }]} testID={o.testID}>
                <Text style={[styles.subtleText, o.tone === 'danger' && { color: '#FF6B6B' }]}>{o.label}</Text>
              </Pressable>
            ),
          )}
        </View>
      </View>
    </Modal>
  );
}

export function InfoSheet({ visible, title, body, onClose, bottomInset }: { visible: boolean; title: string; body: string; onClose: () => void; bottomInset: number }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: bottomInset + 16 }]}>
        <Text style={styles.sheetTitle}>{title}</Text>
        <ScrollView style={{ maxHeight: 320 }}>
          <Text style={[styles.sheetMsg, { fontSize: 15.5, lineHeight: 23 }]}>{body}</Text>
        </ScrollView>
        <Pressable onPress={onClose} style={[styles.subtleBtn, { marginTop: 16 }]}>
          <Text style={styles.subtleText}>Got it</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ styles */

const styles = StyleSheet.create({
  top: { paddingHorizontal: 16, paddingBottom: 10 },
  topOverlay: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,20,22,0.55)' },
  topMid: { flex: 1, alignItems: 'center' },
  localRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  topLocal: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, fontVariant: ['tabular-nums'], letterSpacing: -0.2 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(255,255,255,0.18)' },
  dotDone: { backgroundColor: COLORS.accent },
  dotNow: { backgroundColor: 'rgba(255,255,255,0.75)' },
  toggle: { flexDirection: 'row', backgroundColor: 'rgba(20,20,22,0.62)', borderRadius: 19, padding: 3, gap: 2, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)' },
  toggleItem: { height: 32, paddingHorizontal: 11, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 5 },
  toggleOn: { backgroundColor: COLORS.accent },
  toggleText: { fontSize: 12.5, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  toggleTextOn: { color: COLORS.accentInk, fontWeight: '800' },

  hero: { justifyContent: 'flex-end', backgroundColor: COLORS.bg },
  heroText: { paddingHorizontal: 20, paddingTop: 2, paddingBottom: 0 },
  heroOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  header: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 4 },
  heroOverlayFlow: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  progressLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.6, color: 'rgba(255,255,255,0.6)', marginBottom: 7, textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exEyebrow: { flexShrink: 1, fontSize: 12, fontWeight: '800', letterSpacing: 1.6, color: COLORS.accent },
  exEyebrowNum: { color: COLORS.accent },
  exEyebrowRole: { color: COLORS.textTertiary },
  exEyebrowNext: { color: COLORS.textPrimary },
  exTitle: { fontSize: 30, lineHeight: 34, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.7, marginTop: 4, textShadowColor: 'rgba(0,0,0,0.65)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 },
  exMeta: { fontSize: 15.5, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: 6, fontVariant: ['tabular-nums'], textShadowColor: 'rgba(0,0,0,0.65)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  setRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6, minHeight: 30 },
  groupCard: { marginTop: 2, marginBottom: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  groupHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  groupBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, height: 24, borderRadius: 12, backgroundColor: COLORS.accent },
  groupBadgeText: { fontSize: 11.5, fontWeight: '900', letterSpacing: 1.4, color: COLORS.accentInk },
  groupRoundBig: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, fontVariant: ['tabular-nums'] },
  groupRound: { fontSize: 12.5, fontWeight: '700', color: COLORS.textSecondary },
  groupItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, paddingHorizontal: 6, marginHorizontal: -6, borderRadius: 10 },
  groupItemOn: { backgroundColor: 'rgba(255,255,255,0.07)' },
  groupMarkerBox: { width: 28, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  groupMarkerBoxOn: { backgroundColor: COLORS.accent },
  groupMarkerBoxDone: { backgroundColor: 'rgba(255,255,255,0.04)' },
  groupRx: { fontSize: 13, fontWeight: '700', color: COLORS.textTertiary, fontVariant: ['tabular-nums'], maxWidth: 110 },
  groupNow: { fontSize: 10.5, fontWeight: '900', letterSpacing: 1.2, color: COLORS.accent },
  groupHow: { fontSize: 12.5, lineHeight: 17, color: COLORS.textSecondary, marginTop: 4, marginBottom: 2 },
  tagOnPhoto: { position: 'absolute', left: 20, bottom: 10 },
  side: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1.6, color: COLORS.accent, marginBottom: 2 },
  restRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 0 },
  restEyebrow: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.6, color: COLORS.accent },
  timePills: { flexDirection: 'row', gap: 8, marginTop: 10 },
  restCue: { fontSize: 13.5, lineHeight: 19, color: 'rgba(255,255,255,0.72)', marginTop: 6, fontWeight: '500' },
  page: { paddingHorizontal: 20 },
  whereOne: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  where: { marginTop: 6, marginBottom: 10, paddingBottom: 0 },
  segmentsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  segments: { flex: 1, flexDirection: 'row', gap: 4, alignItems: 'center' },
  blockNo: { fontSize: 11, fontWeight: '700', color: COLORS.textTertiary, fontVariant: ['tabular-nums'] },
  then: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginTop: 3 },
  segment: { flex: 1, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  segmentCurrent: { height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.22)', marginTop: -1 },
  segmentFill: { height: '100%', backgroundColor: COLORS.accent },
  whereRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  whereLeft: { fontSize: 12.5, fontWeight: '600', color: COLORS.textTertiary, fontVariant: ['tabular-nums'], flexShrink: 0 },
  coach: { flexDirection: 'row', gap: 7, marginTop: 14, alignSelf: 'flex-start', maxWidth: '100%' },
  coachText: { flexShrink: 1, fontSize: 14.5, lineHeight: 21, color: COLORS.textPrimary, fontWeight: '500' },

  demoChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.10)', marginLeft: 'auto' },
  demoText: { fontSize: 11.5, fontWeight: '700', color: COLORS.textPrimary },

  since: { fontSize: 12.5, color: COLORS.textTertiary, marginBottom: 8, fontVariant: ['tabular-nums'] },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(20,20,22,0.7)' },
  tagText: { fontSize: 11, fontWeight: '800', color: COLORS.accent, letterSpacing: 0.8 },
  eyebrow: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1.8, color: COLORS.accent, flexShrink: 1, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 2 },
  name: { flexShrink: 1, fontSize: 26, lineHeight: 31, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.6, textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  targetRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 28, paddingHorizontal: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)' },
  chipMethod: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipText: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 0.2, fontVariant: ['tabular-nums'] },
  dual: { flexDirection: 'row', gap: 10 },
  dualRight: { flex: 1, height: 60 },
  target: { fontSize: 36, lineHeight: 42, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -1.8, fontVariant: ['tabular-nums'] },
  effort: { fontSize: 14, color: COLORS.textTertiary, marginTop: 2, fontWeight: '600' },
  qsLine: { flexDirection: 'row', gap: 7, marginTop: 12, alignItems: 'flex-start' },
  effortCenter: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  qs: { flexDirection: 'row', gap: 8, marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  qsText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: COLORS.textSecondary, fontWeight: '600' },
  guidanceLine: { fontSize: 15, lineHeight: 22, color: COLORS.textPrimary, marginTop: 12, fontWeight: '500' },
  cues: { marginTop: 6, gap: 4 },
  cueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  cueDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.accent, marginTop: 7 },
  cue: { flexShrink: 1, fontSize: 13.5, lineHeight: 18.5, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  moveLine: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 2 },
  moveText: { fontSize: 13, fontWeight: '700', color: PHASE_COLOR.move, fontVariant: ['tabular-nums'] },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.06)', maxWidth: 150 },
  groupPillOn: { backgroundColor: COLORS.accent },
  groupPillDone: { opacity: 0.6 },
  groupMarker: { fontSize: 12, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 0.3 },
  groupName: { flex: 1, fontSize: 14.5, fontWeight: '600', color: 'rgba(255,255,255,0.78)' },
  groupNameOn: { color: COLORS.textPrimary, fontWeight: '800' },
  scaling: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  scalingText: { fontSize: 13.5, color: COLORS.textSecondary },

  upNext: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, padding: 14, borderRadius: 18, alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)',
  },
  upEyebrow: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.5, color: COLORS.textTertiary },
  upTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginTop: 3 },
  upTarget: { fontSize: 14, fontWeight: '700', color: COLORS.accent, marginTop: 2 },
  upQs: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 4 },

  phase: { fontSize: 26, fontWeight: '900', letterSpacing: 3, marginBottom: 6 },
  emomSub: { fontSize: 13, fontWeight: '700', color: '#6CC7F5', marginTop: 2 },
  clockTarget: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },

  readyFormat: { fontSize: 16, fontWeight: '700', color: COLORS.accent, marginTop: 8 },
  // neutral raised surface, gold only as the mark (the count)
  roundsCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  roundsBig: { alignItems: 'center', minWidth: 56 },
  roundsNum: { fontSize: 40, lineHeight: 44, fontWeight: '800', color: COLORS.accent, fontVariant: ['tabular-nums'] },
  roundsWord: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.6, color: COLORS.textSecondary },
  roundsHead: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  roundsSub: { fontSize: 13.5, color: COLORS.textSecondary, marginTop: 3 },
  roundsListLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.6, color: COLORS.textTertiary, marginTop: 18 },
  readyMarker: { width: 16, fontSize: 13, fontWeight: '800', color: COLORS.textTertiary, textAlign: 'center', fontVariant: ['tabular-nums'] },
  readyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  readyName: { fontSize: 15.5, fontWeight: '700', color: COLORS.textPrimary },
  readyMeta: { fontSize: 13, color: COLORS.textTertiary, marginTop: 1 },
  readyNote: { fontSize: 13, color: COLORS.textTertiary, marginTop: 18 },
  guidance: { fontSize: 14.5, lineHeight: 21, color: COLORS.textSecondary, marginTop: 16 },
  edgeLead: { fontSize: 15, color: COLORS.textSecondary, marginTop: 8, fontWeight: '500' },
  edgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  edgeGlyph: { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  prepHead: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  prepBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)' },
  prepBadgeText: { fontSize: 11.5, fontWeight: '900', letterSpacing: 1.6, color: COLORS.textPrimary },
  prepMeta: { fontSize: 12.5, fontWeight: '600', color: COLORS.textTertiary },
  prepTitle: { fontSize: 30, lineHeight: 35, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.7, marginTop: 12 },
  prepProgress: { fontSize: 12.5, color: COLORS.textTertiary, marginTop: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepRail: { width: 30, alignItems: 'center', alignSelf: 'stretch' },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  stepNumOn: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  stepNumText: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },
  stepLine: { flex: 1, width: 1.5, backgroundColor: 'rgba(255,255,255,0.14)', marginVertical: 4 },
  stepThumb: { marginLeft: 12, marginBottom: 14 },
  stepBody: { flex: 1, minWidth: 0, paddingLeft: 12, paddingBottom: 18, paddingTop: 3 },
  edgeHead: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 8, rowGap: 2 },
  edgeName: { flexShrink: 1 },
  edgeRx: { fontSize: 13.5, fontWeight: '700', color: COLORS.accent, fontVariant: ['tabular-nums'] },
  edgeChoice: { fontSize: 11.5, fontWeight: '700', color: COLORS.textTertiary, marginTop: 3, letterSpacing: 0.3 },
  edgeNote: { flexDirection: 'row', gap: 8, marginTop: 16, paddingHorizontal: 2 },
  edgeNoteText: { flex: 1, fontSize: 13, lineHeight: 19, color: COLORS.textTertiary },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  finishIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accent },

  actions: { paddingHorizontal: 20, paddingTop: 10 },
  nextLine: { fontSize: 12.5, color: COLORS.textTertiary, textAlign: 'center', marginBottom: 10, fontWeight: '600' },
  primary: { height: 60, borderRadius: 18, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 18, fontWeight: '800', color: COLORS.accentInk },
  subtleBtn: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  subtleText: { fontSize: 16.5, fontWeight: '700', color: COLORS.textPrimary },
  secondaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, minHeight: 30 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  linkText: { fontSize: 13.5, fontWeight: '600', color: COLORS.textTertiary },
  pill: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)' },
  pillText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },

  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: COLORS.sheet },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  sheetMsg: { fontSize: 14.5, lineHeight: 21, color: COLORS.textSecondary, marginTop: 6 },
});
