/**
 * ShareCard: the post-workout overlay card, in the V2 Instagram card design (components/WorkoutStatsCard.tsx). 1:1 square
 * (founder ask, Oct 2026: every treatment tightened so all content fits a square).
 *
 *   Every card shows the same three stats: minutes, calories, intensity ("–" until a number is in).
 *   rings      the three concentric gold rings (calories · minutes · intensity), each filling toward its goal (founder pass,
 *              Oct 2026: calories and minutes goals and the 0-100 intensity come from utils/v3Session/ringGoals), minutes
 *              left, intensity right, exercises, MOOD. On screen the rings sweep in (`animate`); captures are always static.
 *   simple     the big gradient MOOD wordmark, the exercise list, the four-stat pill
 *   heartrate  V2's heart-rate tracker: the wordmark, the exercises, HEART RATE (avg · peak), the gold area chart and the
 *              wearable strip. Always offered (founder review 6). With avg / peak (wearable or typed) the curve is drawn
 *              through those numbers (V2's shape: warm-up rise, working plateau, cool-down); without them the chart is a
 *              dim outline and the numbers read "–" until they are added on the Share screen.
 *
 * Real numbers only: a ring, a stat cell or a legend entry exists only when the number does (a wearable or the athlete
 * entered it). No number is estimated. `transparent` renders the same layout without the card frame for an Instagram Story
 * sticker (white text with shadows, as V2).
 */
import React, { forwardRef, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../../SafeLinearGradient';
import { heartRateCurve } from '../../../utils/v3Session/heartCurve';
export { heartRateCurve };

// MaskedView can be missing in some production builds (V2 does the same safe import).
let MaskedView: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  MaskedView = require('@react-native-masked-view/masked-view').default;
} catch {
  MaskedView = null;
}

export type ShareTreatment = 'rings' | 'simple' | 'heartrate';
export const SHARE_TREATMENTS: { id: ShareTreatment; label: string }[] = [
  { id: 'rings', label: 'Rings' },
  { id: 'simple', label: 'Simple' },
  { id: 'heartrate', label: 'Heart rate' },
];

export interface ShareData {
  title: string;
  direction: string;
  dateLabel: string;
  minutes: number | null;
  sets: number | null;
  intervals: number | null;
  calories: number | null;
  avgHr: number | null;
  maxHr: number | null;
  steps?: number | null;
  hrv?: number | null;
  /** heart rate / calories came from a wearable (the LIVE badge) */
  hrFromWearable?: boolean;
  /** stable per-session seed for the heart-rate curve's shape */
  seed?: string;
  streak: number | null;
  /** ring goals (utils/v3Session/ringGoals): the chosen session length and a calories target for the Direction */
  minutesGoal?: number | null;
  caloriesGoal?: number | null;
  /** 0-100 session intensity (heart rate when there is one, otherwise the work completed vs the plan) */
  intensity?: number | null;
  intensitySource?: 'heart' | 'work' | null;
  /** exercise names in workout order */
  exercises: string[];
  blocks: { label: string; lines: string[] }[];
}

/** Every treatment is offered; Heart rate shows "–" until there is a number. */
export function availableTreatments(_d: ShareData): { id: ShareTreatment; label: string }[] {
  return SHARE_TREATMENTS;
}

function curvePath(points: number[], width: number, height: number, pad = 4): { line: string; area: string } {
  if (points.length < 2) return { line: '', area: '' };
  const min = Math.min(...points) - 5, max = Math.max(...points) + 5, range = Math.max(1, max - min);
  const iw = width - pad * 2, ih = height - pad * 2, step = iw / (points.length - 1);
  const xy = points.map((v, i) => ({ x: pad + i * step, y: pad + ih - ((v - min) / range) * ih }));
  let line = `M ${xy[0].x.toFixed(1)} ${xy[0].y.toFixed(1)}`;
  for (let i = 1; i < xy.length; i++) {
    const a = xy[i - 1], b = xy[i];
    line += ` Q ${((a.x + b.x) / 2).toFixed(1)} ${a.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  const area = `${line} L ${xy[xy.length - 1].x.toFixed(1)} ${(pad + ih).toFixed(1)} L ${xy[0].x.toFixed(1)} ${(pad + ih).toFixed(1)} Z`;
  return { line, area };
}

function HeartChart({ d, width, height }: { d: ShareData; width: number; height: number }) {
  const { points, real } = heartRateCurve(d.avgHr, d.maxHr, d.seed ?? d.title);
  const { line, area } = curvePath(points, width, height);
  return (
    <View style={{ marginTop: 8, opacity: real ? 1 : 0.35 }} testID={real ? 'v3-share-hr-chart' : 'v3-share-hr-chart-empty'}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgGradient id="v3hrArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFD700" stopOpacity={real ? 0.55 : 0.25} />
            <Stop offset="100%" stopColor="#FFD700" stopOpacity="0.02" />
          </SvgGradient>
        </Defs>
        <Path d={area} fill="url(#v3hrArea)" />
        <Path d={line} stroke="#FFD700" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={real ? undefined : '3 4'} />
      </Svg>
    </View>
  );
}

/** Card surface for the Taupe Silk palette: espresso, a step deeper than COLORS.sheet, so gold and cream hold contrast. */
const CARD = { top: '#3B322D', bottom: '#2A231F', edge: 'rgba(255, 240, 220, 0.14)' };

const GOLD = {
  caloriesStart: '#B8860B', caloriesEnd: '#8B6914', caloriesGlow: '#CD9B1D',
  minutesStart: '#FFD700', minutesEnd: '#DAA520', minutesGlow: '#FFE44D',
  intensityStart: '#FFE5A0', intensityEnd: '#FFD56B', intensityGlow: '#FFF3C4',
  trackBg: 'rgba(255, 240, 220, 0.09)', trackBgTransparent: 'rgba(255, 250, 242, 0.1)',
};
const RING_SIZE = 130, RING_CENTER = RING_SIZE / 2, R_CAL = 56, R_MIN = 45, R_INT = 34, STROKE = 4;
const CAL_TARGET = 500, MIN_TARGET = 60, INT_TARGET = 100;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function dash(progress: number, r: number) {
  const c = 2 * Math.PI * r;
  return { dashArray: `${c} ${c}`, dashOffset: c * (1 - Math.max(0, Math.min(1, progress))) };
}

/** V2's three concentric rings (calories · minutes · intensity); a ring is drawn only for a real number (its track stays).
 *  `grow` (0 -> 1) sweeps the arcs in from empty; without it the rings render at their final length (captures). */
function Rings({ d, transparent, grow, size = RING_SIZE }: { d: ShareData; transparent: boolean; grow?: Animated.Value; size?: number }) {
  const track = transparent ? GOLD.trackBgTransparent : GOLD.trackBg;
  const rings = [
    { r: R_CAL, v: d.calories, t: d.caloriesGoal || CAL_TARGET, grad: 'v3cal', gloss: 'v3glossCal', gw: 0.5 },
    { r: R_MIN, v: d.minutes, t: d.minutesGoal || MIN_TARGET, grad: 'v3min', gloss: 'v3glossMin', gw: 0.4 },
    { r: R_INT, v: d.intensity ?? null, t: INT_TARGET, grad: 'v3hr', gloss: 'v3glossHr', gw: 0.4 },
  ];
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
      <Defs>
        <SvgGradient id="v3cal" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={GOLD.caloriesGlow} /><Stop offset="30%" stopColor={GOLD.caloriesStart} /><Stop offset="70%" stopColor={GOLD.caloriesEnd} /><Stop offset="100%" stopColor={GOLD.caloriesGlow} />
        </SvgGradient>
        <SvgGradient id="v3min" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={GOLD.minutesGlow} /><Stop offset="40%" stopColor={GOLD.minutesStart} /><Stop offset="80%" stopColor={GOLD.minutesEnd} /><Stop offset="100%" stopColor={GOLD.minutesGlow} />
        </SvgGradient>
        <SvgGradient id="v3hr" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={GOLD.intensityGlow} /><Stop offset="35%" stopColor={GOLD.intensityStart} /><Stop offset="70%" stopColor={GOLD.intensityEnd} /><Stop offset="100%" stopColor={GOLD.intensityGlow} />
        </SvgGradient>
        <SvgGradient id="v3glossCal" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" /><Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.05" /><Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
        </SvgGradient>
        <SvgGradient id="v3glossMin" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" /><Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" /><Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
        </SvgGradient>
        <SvgGradient id="v3glossHr" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" /><Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.15" /><Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
        </SvgGradient>
      </Defs>
      <G rotation="90" origin={`${RING_CENTER}, ${RING_CENTER}`}>
        {rings.map((x) => <Circle key={`t${x.r}`} cx={RING_CENTER} cy={RING_CENTER} r={x.r} stroke={track} strokeWidth={STROKE} fill="none" />)}
        {rings.filter((x) => x.v != null).map((x) => {
          const dd = dash(x.v! / x.t, x.r);
          const flip = `scale(-1, 1) translate(-${RING_SIZE}, 0)`;
          const circ = 2 * Math.PI * x.r;
          const offset: any = grow ? grow.interpolate({ inputRange: [0, 1], outputRange: [circ, dd.dashOffset] }) : dd.dashOffset;
          const C: any = grow ? AnimatedCircle : Circle;
          return (
            <G key={`r${x.r}`}>
              <C cx={RING_CENTER} cy={RING_CENTER} r={x.r} stroke={`url(#${x.grad})`} strokeWidth={STROKE} fill="none" strokeDasharray={dd.dashArray} strokeDashoffset={offset} strokeLinecap="round" transform={flip} />
              <C cx={RING_CENTER} cy={RING_CENTER} r={x.r} stroke={`url(#${x.gloss})`} strokeWidth={STROKE * x.gw} fill="none" strokeDasharray={dd.dashArray} strokeDashoffset={offset} strokeLinecap="round" transform={flip} />
            </G>
          );
        })}
      </G>
    </Svg>
  );
}

/** V2 landing-page wordmark: 48 / bold / letterSpacing 2, masked over #FFD700 → #FFA500. */
function MoodHeader({ transparent }: { transparent: boolean }) {
  const text = <Text style={[styles.altMoodHeader, transparent && styles.shadow]}>MOOD</Text>;
  if (!MaskedView) return text;
  return (
    <View style={styles.altMoodHeaderWrap}>
      <MaskedView maskElement={text}>
        <LinearGradient colors={['#FFD700', '#FFA500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.altMoodGradient} />
      </MaskedView>
    </View>
  );
}

/** The exercise list. When there are more than fit, a small "+N" chip sits at the end of the last row (no extra line), so
 *  the card can show one more exercise than the old "+N more" row allowed. */
function ExerciseList({ names, max, transparent, alt, tight, grid }: { names: string[]; max: number; transparent: boolean; alt?: boolean; tight?: boolean; grid?: boolean }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  const chip = <View style={[styles.moreChip, transparent && styles.moreChipStory]} testID="v3-share-more"><Text style={styles.moreChipText}>{`+${extra}`}</Text></View>;
  if (grid) {
    // two per row: four exercises in two short lines (the square cards)
    const rows: string[][] = [];
    for (let i = 0; i < shown.length; i += 2) rows.push(shown.slice(i, i + 2));
    return (
      <View style={styles.grid}>
        {rows.map((r, ri) => (
          <View key={ri} style={styles.gridRow}>
            {r.map((n, ci) => (
              <View key={ci} style={styles.gridCell}>
                <View style={styles.exerciseDot} />
                <Text style={[styles.gridText, transparent && styles.onStory, transparent && styles.shadow]} numberOfLines={1}>{n}</Text>
                {extra > 0 && ri === rows.length - 1 && ci === r.length - 1 ? chip : null}
              </View>
            ))}
            {r.length === 1 ? <View style={styles.gridCell} /> : null}
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={alt ? styles.altExercises : [styles.exercises, tight && styles.exercisesTight]}>
      {shown.map((n, i) => (
        <View key={i} style={[alt ? styles.altExerciseRow : styles.exerciseRow, tight && styles.exerciseRowTight]}>
          <View style={alt ? styles.altExerciseDot : styles.exerciseDot} />
          <Text style={[alt ? styles.altExerciseText : styles.exerciseText, transparent && styles.onStory, transparent && styles.shadow]} numberOfLines={1}>
            {n.length > 40 ? n.slice(0, 37) + '...' : n}
          </Text>
          {extra > 0 && i === shown.length - 1 ? chip : null}
        </View>
      ))}
    </View>
  );
}

const spaced = (s: string) => s.toUpperCase().split(' ').map((w) => w.split('').join(' ')).join('   ');

interface Props {
  data: ShareData;
  treatment: ShareTreatment;
  width: number;
  transparent?: boolean;
  /** sweep the rings in on mount (the on-screen card only; never the offscreen sticker) */
  animate?: boolean;
  /** with `animate`: hold the rings empty until this turns true (the celebration screen is still up) */
  play?: boolean;
}

export const ShareCard = forwardRef<View, Props>(function ShareCard({ data: d, treatment, width, transparent = false, animate = false, play = true }, ref) {
  const grow = useRef(new Animated.Value(animate ? 0 : 1)).current;
  useEffect(() => {
    if (!animate || !play) return;
    Animated.timing(grow, { toValue: 1, duration: 1900, delay: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [animate, play, grow]);
  const ringsGrow = animate ? grow : undefined;
  const height = width; // 1:1
  const title = (d.title || 'WORKOUT COMPLETE').toUpperCase();
  const sub = spaced(d.direction);
  const ringSize = Math.round(Math.min(124, width * 0.41));
  // Simple: a single column, as many rows as the square leaves (2-5)
  const simpleRows = Math.max(2, Math.min(5, Math.floor((height - 178) / 24)));
  // the three stats on every card (founder ask, Oct 2026): minutes, calories, intensity. Always all three, in that order;
  // a number not in yet reads "–" (nothing is estimated). Rings: calories in the centre, minutes and intensity beside it.
  const dash = (v: number | null | undefined) => (v != null ? String(v) : '–');
  const core = [
    { k: 'MIN', v: dash(d.minutes) },
    { k: 'CAL', v: dash(d.calories) },
    { k: 'INTENSITY', v: dash(d.intensity) },
  ];
  // centre of the rings: the calories number with a short "cals" label (the goal still sets how far the ring fills; the
  // "of 360 cal" label overlapped the inner ring, founder test Oct 2026)
  const centerV = { v: dash(d.calories), c: GOLD.caloriesStart };

  let content: React.ReactNode;
  if (treatment === 'rings' && transparent) {
    content = (
      <>
        <View style={styles.tHeader}>
          <Text style={[styles.tTitle, styles.shadow]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.tSub, styles.shadow]} numberOfLines={1}>{sub}</Text>
        </View>
        <View style={styles.tCenter}>
          <View style={styles.tMain}>
            <View style={styles.ringBox}>
              <Rings d={d} transparent grow={ringsGrow} />
              <View style={styles.ringCenter}>
                <Text style={[styles.tCenterV, { color: centerV.c }, styles.shadow]}>{centerV.v}</Text>
                <Text style={[styles.tCenterK, styles.shadow]}>cals</Text>
              </View>
            </View>
            <View style={styles.tData}>
              <View style={styles.tDataRow}><View style={[styles.tDot, { backgroundColor: GOLD.minutesStart }]} /><Text style={[styles.tDataV, styles.shadow]}>{dash(d.minutes)}</Text><Text style={[styles.tDataK, styles.shadow]}>min</Text></View>
              <View style={styles.tDataRow}><View style={[styles.tDot, { backgroundColor: GOLD.intensityStart }]} /><Text style={[styles.tDataV, styles.shadow]}>{dash(d.intensity)}</Text><Text style={[styles.tDataK, styles.shadow]}>intensity</Text></View>
            </View>
          </View>
          <ExerciseList names={d.exercises} max={4} transparent tight />
        </View>
        <View style={styles.tFooter}><Text style={[styles.tBrand, styles.shadow]}>MOOD</Text></View>
      </>
    );
  } else if (treatment === 'rings') {
    const stat = (c: string, v: string, k: string, testID?: string) => (
      <View style={styles.sqStat} testID={testID}>
        <View style={[styles.sqDot, { backgroundColor: c }]} />
        <Text style={styles.sqStatV}>{v}</Text>
        <Text style={styles.sqStatK} numberOfLines={1}>{k}</Text>
      </View>
    );
    content = (
      <View style={styles.sqInner}>
        <View>
          <Text style={styles.sqTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{title}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{sub}</Text>
        </View>
        <View style={styles.sqRingRow}>
          <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
            <Rings d={d} transparent={false} grow={ringsGrow} size={ringSize} />
            <View style={styles.ringCenter}>
              <Text style={[styles.centerValue, { color: centerV.c }]}>{centerV.v}</Text>
              <Text style={styles.centerLabel}>cals</Text>
            </View>
          </View>
          <View style={styles.sqStats}>
            {stat(GOLD.minutesStart, dash(d.minutes), d.minutesGoal ? `of ${d.minutesGoal} min` : 'min', 'v3-share-stat-min')}
            {stat(GOLD.intensityStart, dash(d.intensity), 'intensity', 'v3-share-stat-intensity')}
          </View>
        </View>
        <ExerciseList names={d.exercises} max={4} transparent={false} grid />
        <View style={styles.sqFooter}>
          <Text style={styles.brandText}>MOOD</Text>
          <Text style={styles.sqDate}>{d.dateLabel}</Text>
        </View>
      </View>
    );
  } else {
    const split = title.split(/[\s/]+/).filter(Boolean).slice(0, 2);
    const cells = core;
    content = (
      <View style={styles.altInner}>
        <MoodHeader transparent={transparent} />
        {treatment === 'heartrate'
          ? <View style={{ flex: 1, justifyContent: 'center' }}><ExerciseList names={d.exercises} max={4} transparent={transparent} grid /></View>
          : <ExerciseList names={d.exercises} max={simpleRows} transparent={transparent} alt tight />}
        {treatment === 'heartrate' ? (
          <View testID="v3-share-hr">
            <View style={styles.hrHead}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="heart" size={12} color="#FFD700" />
                <Text style={[styles.hrLabel, transparent && styles.shadow]}>HEART RATE</Text>
                {d.hrFromWearable && (d.avgHr != null || d.maxHr != null) ? <View style={styles.liveBadge}><Text style={styles.liveText}>LIVE</Text></View> : null}
              </View>
              <Text style={[styles.hrStats, transparent && styles.shadow]}>
                avg <Text style={styles.hrStatV}>{d.avgHr ?? '–'}</Text>
                {'  ·  '}peak <Text style={styles.hrStatV}>{d.maxHr ?? '–'}</Text> bpm
              </Text>
            </View>
            <HeartChart d={d} width={width - 36} height={Math.round(width * 0.17)} />
            <View style={styles.strip}>
              {core.map((c) => (
                <View key={c.k} style={styles.stripCell}>
                  <Text style={[styles.stripV, transparent && styles.shadow]}>{c.v}</Text>
                  <Text style={styles.stripK} numberOfLines={1}>{c.k}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.pill}>
            {cells.map((c, i) => (
              <React.Fragment key={c.k}>
                {i > 0 ? <View style={styles.pillDivider} /> : null}
                <View style={styles.pillCell}><Text style={styles.pillV}>{c.v}</Text><Text style={styles.pillK} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{c.k}</Text></View>
              </React.Fragment>
            ))}
            {cells.length ? <View style={styles.pillDivider} /> : null}
            <View style={styles.pillCell}>
              {split.map((w, i) => <Text key={i} style={styles.pillSplit} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>{w}</Text>)}
            </View>
          </View>
        )}
      </View>
    );
  }

  if (transparent) {
    return (
      <View ref={ref} collapsable={false} style={[styles.transparent, { width, height }]}>
        {content}
      </View>
    );
  }
  return (
    <View ref={ref} collapsable={false} style={[styles.container, { width, height }]}>
      <View style={styles.inner}>
        {/* Taupe Silk card (Oct 2026): deep espresso from the app's own warm family instead of near-black, so the card reads as
            a richer layer of the taupe page (and still looks premium on its own when shared), with a faint warm light at the top */}
        <LinearGradient colors={[CARD.top, CARD.bottom]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill as any} />
        <LinearGradient colors={['rgba(255, 214, 150, 0.10)', 'rgba(255, 214, 150, 0.02)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.55 }} style={styles.topGlow} />
        {content}
      </View>
    </View>
  );
});

const SHADOW = { textShadowColor: 'rgba(0, 0, 0, 0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 } as const;

const styles = StyleSheet.create({
  container: { borderRadius: 20, overflow: 'hidden' },
  inner: { flex: 1, backgroundColor: CARD.bottom, borderRadius: 20, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: CARD.edge },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  transparent: { backgroundColor: 'transparent', overflow: 'hidden', justifyContent: 'space-between' },
  shadow: SHADOW,
  onStory: { color: '#FFFAF2' },

  header: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 8 },
  moodCategory: { fontSize: 22, fontWeight: '600', color: '#FFFAF2', letterSpacing: 0.5 },
  subtitle: { fontSize: 10, color: 'rgba(255, 250, 242, 0.4)', letterSpacing: 0.5, marginTop: 6, fontWeight: '400' },
  ringSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  sideStat: { alignItems: 'center', width: 60 },
  durationValue: { fontSize: 24, fontWeight: '300', color: '#FFFAF2', letterSpacing: -1 },
  sideLabel: { fontSize: 10, color: 'rgba(255, 250, 242, 0.5)', marginTop: 2 },
  intensityValue: { fontSize: 24, fontWeight: '300', color: GOLD.intensityStart, letterSpacing: -1 },
  ringBox: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  centerValue: { fontSize: 24, fontWeight: '300', letterSpacing: -1 },
  centerLabel: { fontSize: 9, color: 'rgba(255, 250, 242, 0.5)', marginTop: 2 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingBottom: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 9, color: 'rgba(255, 250, 242, 0.5)' },
  exercises: { flex: 1, paddingHorizontal: 20, paddingTop: 6, overflow: 'hidden' },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 240, 220, 0.07)' },
  exerciseDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255, 215, 0, 0.5)', marginRight: 10 },
  exerciseText: { flex: 1, fontSize: 12, color: 'rgba(255, 250, 242, 0.6)', fontWeight: '400' },
  exercisesTight: { paddingTop: 2 },
  exerciseRowTight: { paddingVertical: 5 },
  headerTight: { paddingTop: 20, paddingBottom: 4 },
  ringSectionTight: { paddingVertical: 6 },
  footerTight: { paddingVertical: 11 },
  sqInner: { flex: 1, paddingTop: 16, paddingHorizontal: 18, paddingBottom: 12, justifyContent: 'space-between' },
  sqTitle: { fontSize: 19, fontWeight: '600', color: '#FFFAF2', letterSpacing: 0.5 },
  sqRingRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sqStats: { flex: 1, gap: 9 },
  sqStat: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  sqDot: { width: 6, height: 6, borderRadius: 3, alignSelf: 'center' },
  sqStatV: { fontSize: 21, fontWeight: '300', color: '#FFFAF2', letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  sqStatK: { flexShrink: 1, fontSize: 10, color: 'rgba(255, 250, 242, 0.5)' },
  sqFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sqDate: { fontSize: 9, color: 'rgba(255, 250, 242, 0.4)', letterSpacing: 1.2, fontWeight: '600' },
  grid: { gap: 2 },
  gridRow: { flexDirection: 'row', gap: 12, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 240, 220, 0.07)' },
  gridCell: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  gridText: { flex: 1, fontSize: 11, color: 'rgba(255, 250, 242, 0.62)' },
  moreChip: { marginLeft: 8, paddingHorizontal: 7, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 250, 242, 0.09)' },
  moreChipStory: { backgroundColor: 'rgba(0, 0, 0, 0.35)' },
  moreChipText: { fontSize: 9.5, fontWeight: '700', color: 'rgba(255, 250, 242, 0.75)', letterSpacing: 0.3 },
  footer: { paddingHorizontal: 20, paddingVertical: 14 },
  brandText: { fontSize: 10, color: '#FFD700', fontWeight: '600', letterSpacing: 2 },

  // transparent (Instagram sticker)
  tHeader: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 4 },
  tTitle: { fontSize: 18, fontWeight: '700', color: '#FFFAF2', letterSpacing: 0.5 },
  tSub: { fontSize: 8, color: '#FFFAF2', letterSpacing: 0.5, marginTop: 3 },
  tCenter: { flex: 1, justifyContent: 'center', paddingVertical: 8 },
  tMain: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 18 },
  tData: { flex: 1, gap: 8 },
  tDataRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  tDot: { width: 6, height: 6, borderRadius: 3, alignSelf: 'center' },
  tDataV: { fontSize: 16, fontWeight: '600', color: '#FFFAF2' },
  tDataK: { fontSize: 10, color: '#FFFAF2' },
  tCenterV: { fontSize: 20, fontWeight: '500', letterSpacing: -0.5 },
  tCenterK: { fontSize: 9, color: '#FFFAF2', marginTop: 1 },
  tFooter: { paddingHorizontal: 20, paddingVertical: 12 },
  tBrand: { fontSize: 14, color: '#FFD700', fontWeight: '700', letterSpacing: 4 },

  // simple / heartrate
  altInner: { flex: 1, paddingTop: 16, paddingHorizontal: 18, paddingBottom: 14 },
  altMoodHeader: { fontSize: 38, fontWeight: 'bold', color: '#fff', letterSpacing: 2, textAlign: 'left' },
  altMoodHeaderWrap: { height: 46, alignSelf: 'flex-start' },
  altMoodGradient: { width: 160, height: 46 },
  altExercises: { flex: 1, marginTop: 6, overflow: 'hidden' },
  altExerciseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 240, 220, 0.07)' },
  altExerciseDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255, 215, 0, 0.5)', marginRight: 10 },
  altExerciseText: { flex: 1, fontSize: 12, color: 'rgba(255, 250, 242, 0.6)' },
  pill: { flexDirection: 'row', alignItems: 'stretch', height: 72, backgroundColor: 'rgba(20, 14, 11, 0.38)', borderRadius: 16, paddingVertical: 6, marginTop: 6 },
  pillDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255, 250, 242, 0.18)', marginVertical: 12 },
  pillCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pillV: { fontSize: 24, fontWeight: '300', color: '#FFFAF2', letterSpacing: -1, lineHeight: 28 },
  pillSplit: { fontSize: 15, fontWeight: '300', color: '#FFFAF2', lineHeight: 18, textAlign: 'center' },
  pillK: { fontSize: 9, color: 'rgba(255, 250, 242, 0.5)', letterSpacing: 1.2, marginTop: 3 },
  hrHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  hrLabel: { fontSize: 10, color: '#FFD700', fontWeight: '600', letterSpacing: 2 },
  liveBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(255, 215, 0, 0.18)' },
  liveText: { fontSize: 8, fontWeight: '800', color: '#FFD700', letterSpacing: 1 },
  hrStats: { fontSize: 11, color: 'rgba(255, 250, 242, 0.7)' },
  hrStatV: { color: '#FFD700', fontWeight: '700' },
  strip: { flexDirection: 'row', marginTop: 6, paddingVertical: 7, borderRadius: 12, backgroundColor: 'rgba(255, 240, 220, 0.07)' },
  stripCell: { flex: 1, alignItems: 'center' },
  stripV: { fontSize: 14, fontWeight: '700', color: '#FFFAF2', letterSpacing: -0.2 },
  stripK: { fontSize: 8, color: 'rgba(255, 250, 242, 0.5)', letterSpacing: 1, marginTop: 2 },
});
