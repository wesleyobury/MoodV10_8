/**
 * StateCard: one Home State selector drawn as a small piece of artwork (founder Home redesign, Oct 2026).
 *
 * Taupe Silk (Oct 2026): skies lifted a step brighter so the tiles glow on the taupe canvas.
 * Each State has its own scene (vector landscape, no bundled images): Low Energy is a cool moonlit blue, Amped a warm sunrise
 * behind sharp peaks, Stressed soft violet hills in mist, Bored a magenta dusk with a palm, Irritated jagged red peaks with
 * embers, Sore a green pine valley in fog. A bottom scrim keeps the label legible.
 *
 * Purely presentational: the caller owns the State rules (max 3, Sore -> body map). Selected = brighter State-colour border,
 * a soft glow, full-strength colour and a small check; unselected tiles sit slightly dimmed. Replacing a scene with a photo
 * later only touches `StateArt`.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient as SvgGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import type { V3State } from '../../utils/v3Api';

interface Theme {
  /** label icon + selected border/glow */
  accent: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  sky: [string, string, string];
}

export const STATE_THEME: Record<V3State, Theme> = {
  low_energy: { accent: '#9CC3FF', icon: 'battery-low', sky: ['#22304F', '#3E5F94', '#7FA6D6'] },
  amped: { accent: '#FFD36B', icon: 'lightning-bolt', sky: ['#4A2408', '#B56518', '#F6B65A'] },
  stressed: { accent: '#CDB0FF', icon: 'spa', sky: ['#2A1C47', '#5D3F98', '#A98BE0'] },
  bored: { accent: '#FF9CC2', icon: 'emoticon-neutral', sky: ['#46142F', '#A1356A', '#F07FA8'] },
  irritated: { accent: '#FF8E73', icon: 'fire', sky: ['#3B0F0C', '#8E2A1E', '#E0684E'] },
  sore: { accent: '#8DEDBF', icon: 'bandage', sky: ['#0E2A1F', '#2A6A4D', '#6CC59A'] },
};

/* ------------------------------------------------------------------ scenes (viewBox 120 x 84) */

function pine(x: number, base: number, h: number, fill: string, key: string) {
  const w = h * 0.42;
  return (
    <Path
      key={key}
      d={`M${x} ${base - h} L${x + w * 0.55} ${base - h * 0.55} L${x + w * 0.32} ${base - h * 0.55} L${x + w} ${base} L${x - w} ${base} L${x - w * 0.32} ${base - h * 0.55} L${x - w * 0.55} ${base - h * 0.55} Z`}
      fill={fill}
    />
  );
}

function Scene({ id }: { id: V3State }) {
  switch (id) {
    case 'low_energy':
      return (
        <>
          <Circle cx={92} cy={19} r={5.5} fill="#D7E6FF" opacity={0.5} />
          <Circle cx={92} cy={19} r={11} fill="#D7E6FF" opacity={0.08} />
          <Path d="M0 52 L18 37 L30 45 L46 29 L62 43 L78 31 L96 45 L120 35 V84 H0Z" fill="#2A4A78" opacity={0.85} />
          <Path d="M0 62 L22 49 L40 58 L58 45 L76 56 L94 47 L120 58 V84 H0Z" fill="#162C4A" />
          <Path d="M0 72 L30 63 L60 70 L90 61 L120 68 V84 H0Z" fill="#0A1628" />
        </>
      );
    case 'amped':
      return (
        <>
          <Circle cx={62} cy={44} r={30} fill="url(#glow-amped)" />
          <Ellipse cx={30} cy={20} rx={26} ry={2} fill="#FFD27A" opacity={0.12} />
          <Ellipse cx={92} cy={28} rx={22} ry={1.6} fill="#FFD27A" opacity={0.1} />
          <Path d="M0 56 L14 41 L24 48 L38 24 L52 44 L64 35 L80 50 L96 30 L110 43 L120 38 V84 H0Z" fill="#6A380F" />
          <Path d="M0 64 L18 52 L34 60 L50 46 L68 60 L86 50 L104 58 L120 52 V84 H0Z" fill="#3A1E07" />
          <Path d="M0 74 L26 66 L54 72 L84 64 L120 71 V84 H0Z" fill="#1A0D03" />
        </>
      );
    case 'stressed':
      return (
        <>
          <Circle cx={84} cy={24} r={4} fill="#E9DCFF" opacity={0.45} />
          <Path d="M0 50 Q30 34 60 46 T120 40 V84 H0Z" fill="#4A3282" opacity={0.85} />
          <Rect x={0} y={46} width={120} height={6} fill="#C9B3FF" opacity={0.1} />
          <Path d="M0 60 Q26 48 54 58 T120 54 V84 H0Z" fill="#2A1A4C" />
          <Rect x={0} y={58} width={120} height={5} fill="#C9B3FF" opacity={0.07} />
          <Path d="M0 71 Q34 62 66 70 T120 67 V84 H0Z" fill="#130B25" />
        </>
      );
    case 'bored':
      return (
        <>
          <Circle cx={80} cy={42} r={13} fill="#FFA3C6" opacity={0.45} />
          <Path d="M0 60 Q40 48 80 58 T120 54 V84 H0Z" fill="#4A1233" />
          <Path d="M0 70 Q36 62 72 68 T120 66 V84 H0Z" fill="#26091C" />
          <Path d="M27 84 Q29 62 36 39" stroke="#1A0713" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          {['M36 39 Q26 31 14 35', 'M36 39 Q45 29 57 32', 'M36 39 Q31 26 25 22', 'M36 39 Q47 37 53 46', 'M36 39 Q24 41 20 50', 'M36 39 Q40 27 47 22'].map((d, i) => (
            <Path key={i} d={d} stroke="#1A0713" strokeWidth={2.2} fill="none" strokeLinecap="round" />
          ))}
        </>
      );
    case 'irritated':
      return (
        <>
          <Circle cx={60} cy={58} r={34} fill="url(#glow-irritated)" />
          <Path d="M0 54 L12 36 L20 46 L32 20 L44 44 L54 30 L66 48 L80 22 L92 44 L104 32 L120 46 V84 H0Z" fill="#5A1313" />
          <Path d="M0 64 L16 50 L28 58 L44 44 L60 60 L76 46 L94 60 L108 50 L120 56 V84 H0Z" fill="#2C0808" />
          <Path d="M0 74 L28 66 L58 73 L88 65 L120 72 V84 H0Z" fill="#130303" />
          {[[22, 30, 1.1, 0.7], [48, 18, 0.8, 0.5], [70, 26, 1.2, 0.65], [96, 16, 0.9, 0.45], [86, 36, 0.7, 0.5], [38, 40, 0.8, 0.55]].map(([x, y, r, o], i) => (
            <Circle key={i} cx={x} cy={y} r={r} fill="#FF7A45" opacity={o} />
          ))}
        </>
      );
    case 'sore':
      return (
        <>
          <Path d="M0 46 Q30 32 62 42 T120 36 V84 H0Z" fill="#1E4E3A" opacity={0.8} />
          <Rect x={0} y={50} width={120} height={8} fill="#BFF5DA" opacity={0.08} />
          <Path d="M0 62 Q32 52 64 60 T120 56 V84 H0Z" fill="#103024" />
          {pine(12, 66, 26, '#0B2219', 'p1')}
          {pine(26, 70, 20, '#0B2219', 'p2')}
          {pine(98, 66, 28, '#0B2219', 'p3')}
          {pine(110, 70, 21, '#0B2219', 'p4')}
          {pine(84, 72, 16, '#0B2219', 'p5')}
          <Path d="M0 74 Q40 68 80 73 T120 72 V84 H0Z" fill="#06150F" />
        </>
      );
  }
}

function StateArt({ id }: { id: V3State }) {
  const t = STATE_THEME[id];
  return (
    <Svg width="100%" height="100%" viewBox="0 0 120 84" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
      <Defs>
        <SvgGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={t.sky[0]} />
          <Stop offset="0.55" stopColor={t.sky[1]} />
          <Stop offset="1" stopColor={t.sky[2]} />
        </SvgGradient>
        <RadialGradient id={`glow-${id}`} cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor={id === 'irritated' ? '#FF5A3A' : '#FFD27A'} stopOpacity={id === 'irritated' ? 0.45 : 0.85} />
          <Stop offset="1" stopColor={id === 'irritated' ? '#FF5A3A' : '#FFD27A'} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={120} height={84} fill={`url(#sky-${id})`} />
      <Scene id={id} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ card */

interface Props {
  id: V3State;
  label: string;
  selected: boolean;
  /** max reached and this one is not selected */
  muted?: boolean;
  width: number;
  height: number;
  onPress: () => void;
  testID?: string;
}

export function StateCard({ id, label, selected, muted, width, height, onPress, testID }: Props) {
  const t = STATE_THEME[id];
  const on = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(on, { toValue: selected ? 1 : 0, useNativeDriver: true, speed: 22, bounciness: 6 }).start();
  }, [selected, on]);

  const dim = on.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0] });
  const check = on;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      testID={testID}
      style={({ pressed }) => [
        { width, height, opacity: muted ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        styles.shadowWrap,
        selected && { shadowColor: t.accent, shadowOpacity: 0.55, shadowRadius: 10, elevation: 6 },
      ]}
    >
      <View style={[styles.card, { borderColor: selected ? t.accent : `${t.accent}55`, borderWidth: selected ? 1.5 : 1 }]}>
        <StateArt id={id} />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.78)']}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.scrim as any}
        />
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: dim }]} />
        <View style={styles.labelRow}>
          <MaterialCommunityIcons name={t.icon} size={16} color={t.accent} />
          <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            {label}
          </Text>
        </View>
        <Animated.View pointerEvents="none" style={[styles.check, { backgroundColor: t.accent, opacity: check, transform: [{ scale: check }] }]}>
          <MaterialCommunityIcons name="check-bold" size={10} color="#0c0c0c" />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadowWrap: { borderRadius: 16, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0 },
  card: { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#111' },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' },
  labelRow: { position: 'absolute', left: 8, right: 8, bottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  label: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.1, flexShrink: 1 },
  check: { position: 'absolute', top: 7, right: 7, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
