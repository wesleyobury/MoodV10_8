/**
 * AchievementMedallion — the badge emblem used by the unlock toast, the Explore feed, the Profile shelf and the stats grid.
 *
 * Founder pass, Oct 2026: a struck coin, not a flat gold disc.
 *   earned  a dark convex bezel with a fine gold rim, a gold face (radial highlight → gold → orange → deep edge), an
 *           engraved inner ring, a soft specular, the glyph in dark ink (never gold-on-gold), and an optional value plate
 *           ("7", "25", "5/7") on the lower rim that says which tier of the badge it is.
 *   locked  the same coin, recessed: a dark face with the glyph as a faint silhouette (what you are working toward, not a
 *           generic padlock), a small lock pip, and an optional gold progress arc on the rim.
 * Built with react-native-svg so it stays crisp at any size. Gold stays a mark (rim, face, arc), never a surface wash.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/brand';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  locked?: boolean;
  /** Close to unlocking: the rim warms (used when no exact progress is known). */
  near?: boolean;
  /** Soft gold glow under an earned coin. Off in dense rows (the Profile shelf). */
  glow?: boolean;
  /** Tier plate on the lower rim: "7", "25", "5/7". */
  value?: string | null;
  /** Locked only: 0..1, drawn as a gold arc around the rim. */
  progress?: number | null;
}

let uidSeq = 0;

export default function AchievementMedallion({ icon, size = 64, locked = false, near = false, glow = true, value = null, progress = null }: Props) {
  const uid = React.useMemo(() => `m${++uidSeq}`, []);
  const glyph = Math.round(size * (value ? 0.36 : 0.4));
  const plate = value ? Math.max(14, Math.round(size * 0.27)) : 0;
  const R = 46; // rim radius in the 100-unit viewBox
  const arc = locked && progress != null ? Math.max(0, Math.min(1, progress)) : 0;
  const circ = 2 * Math.PI * R;

  return (
    <View style={[{ width: size, height: size }, !locked && glow && styles.glow, !locked && styles.lift]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={`${uid}b`} cx="50" cy="30" r="70" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#3B3B41" />
            <Stop offset="0.55" stopColor="#1A1A1E" />
            <Stop offset="1" stopColor="#09090A" />
          </RadialGradient>
          <LinearGradient id={`${uid}r`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFE98A" />
            <Stop offset="0.45" stopColor="#FFC21A" />
            <Stop offset="1" stopColor="#B87400" />
          </LinearGradient>
          <RadialGradient id={`${uid}f`} cx="38" cy="30" r="62" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFF4B8" />
            <Stop offset="0.3" stopColor="#FFD84A" />
            <Stop offset="0.68" stopColor="#F5A700" />
            <Stop offset="1" stopColor="#B36F00" />
          </RadialGradient>
          <RadialGradient id={`${uid}l`} cx="50" cy="34" r="56" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#1F1F23" />
            <Stop offset="1" stopColor="#0C0C0E" />
          </RadialGradient>
          <RadialGradient id={`${uid}s`} cx="50" cy="22" r="34" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={locked ? 0.1 : 0.55} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* bezel */}
        <Circle cx="50" cy="50" r="49.5" fill={`url(#${uid}b)`} />
        {/* rim */}
        <Circle
          cx="50" cy="50" r={R} fill="none"
          stroke={locked ? (near ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.10)') : `url(#${uid}r)`}
          strokeWidth={locked ? 1.5 : 2.2}
        />
        {arc > 0 ? (
          <Circle
            cx="50" cy="50" r={R} fill="none" stroke="#FFC21A" strokeWidth={3} strokeLinecap="round"
            strokeDasharray={`${circ * arc} ${circ}`} transform="rotate(-90 50 50)"
          />
        ) : null}
        {/* face */}
        <Circle cx="50" cy="50" r="39" fill={locked ? `url(#${uid}l)` : `url(#${uid}f)`} />
        {/* engraved inner ring */}
        <Circle cx="50" cy="50" r="34.5" fill="none" stroke={locked ? 'rgba(255,255,255,0.05)' : 'rgba(90,50,0,0.28)'} strokeWidth={1} />
        {/* specular */}
        <Ellipse cx="50" cy="27" rx="27" ry="13" fill={`url(#${uid}s)`} />
      </Svg>

      <View style={[StyleSheet.absoluteFill, styles.center, value ? { paddingBottom: plate * 0.42 } : null]} pointerEvents="none">
        <Ionicons name={icon} size={glyph} color={locked ? 'rgba(255,255,255,0.22)' : COLORS.accentInk} />
      </View>

      {value ? (
        <View style={[styles.plateWrap, { bottom: -plate * 0.12 }]} pointerEvents="none">
          <View style={[styles.plate, { height: plate, borderRadius: plate / 2, paddingHorizontal: plate * 0.38 }, locked && styles.plateLocked]}>
            <Text style={[styles.plateText, { fontSize: plate * 0.62 }, locked && { color: 'rgba(255,255,255,0.45)' }]} numberOfLines={1}>{value}</Text>
          </View>
        </View>
      ) : null}

      {locked && !value ? (
        <View style={[styles.pip, { width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15, right: -size * 0.02, bottom: -size * 0.02 }]}>
          <Ionicons name="lock-closed" size={Math.round(size * 0.15)} color="rgba(255,255,255,0.55)" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  lift: Platform.select({
    ios: { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 6 },
    default: {},
  }) as any,
  glow: Platform.select({
    ios: { shadowColor: '#FFB300', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 8 },
    default: {},
  }) as any,
  plateWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  plate: {
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: 'rgba(255,200,60,0.55)',
  },
  plateLocked: { borderColor: 'rgba(255,255,255,0.14)' },
  plateText: { color: '#FFD84A', fontWeight: '900', letterSpacing: 0.2, fontVariant: ['tabular-nums'] },
  pip: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17171A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
});

/** The tier plate for a badge id: streak_7 -> "7", vol_25 -> "25", consistent_5of7 -> "5/7"; null when there is no number. */
export function achievementValue(id: string): string | null {
  const ofM = id.match(/(\d+)of(\d+)/);
  if (ofM) return `${ofM[1]}/${ofM[2]}`;
  const n = id.match(/_(\d+)$/);
  if (n && Number(n[1]) > 1) return n[1];
  return null;
}
