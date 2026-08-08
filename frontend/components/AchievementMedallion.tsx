/**
 * AchievementMedallion — the premium gold emblem used by the achievement
 * toast and the badge grid.
 *
 * DESIGN GUARDRAILS (memory/DESIGN_GUARDRAILS.md):
 *  - Gold is the gold→orange BRAND_GRADIENT, applied WITH depth (glow +
 *    highlight ring + shadow). Never a flat mustard fill.
 *  - Never gold-on-gold: the icon uses dark ink (accentInk) on the gold.
 *  - Locked state is a recessed dark disc (no gold fill), lock icon in a
 *    muted tone — gold text/emblem never sit on gold.
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient } from './SafeLinearGradient';
import { COLORS } from '../constants/brand';

// A 4-stop gold ramp gives the emblem real dimensionality (highlight → gold →
// orange → deep) rather than a flat two-tone. Still 100% brand gold→orange.
const GOLD_RAMP = ['#FFE98A', '#FFD700', '#FFA500', '#C98A00'];

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  locked?: boolean;
  /** Faint gold rim on a locked badge to signal "close / next up". */
  near?: boolean;
  /** Outer gold halo. Off for dense rows (e.g. the profile badge shelf), where
   *  overlapping halos read as blur rather than depth. Default on so the full
   *  achievements grid keeps its intended treatment. */
  glow?: boolean;
}

export default function AchievementMedallion({ icon, size = 64, locked = false, near = false, glow = true }: Props) {
  const radius = size / 2;
  const iconSize = Math.round(size * 0.46);

  if (locked) {
    return (
      <View
        style={[
          styles.locked,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderColor: near ? 'rgba(255,215,0,0.28)' : 'rgba(255,255,255,0.08)',
          },
        ]}
      >
        <Ionicons
          name="lock-closed"
          size={Math.round(iconSize * 0.8)}
          color={near ? 'rgba(255,215,0,0.42)' : 'rgba(255,255,255,0.26)'}
        />
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size }}>
      {/* Outer glow — a soft gold halo behind the disc for depth. */}
      {glow && (
        <View
          style={[
            styles.glow,
            {
              width: size,
              height: size,
              borderRadius: radius,
              shadowRadius: size * 0.35,
            },
          ]}
        />
      )}
      <SafeLinearGradient
        colors={GOLD_RAMP}
        start={{ x: 0.25, y: 0.1 }}
        end={{ x: 0.85, y: 1 }}
        style={[styles.disc, { width: size, height: size, borderRadius: radius }]}
      >
        {/* Top highlight ring — inset bevel that catches the light. */}
        <View style={[styles.highlight, { borderRadius: radius }]} pointerEvents="none" />
        <Ionicons name={icon} size={iconSize} color={COLORS.accentInk} />
      </SafeLinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    backgroundColor: '#FFA500',
    opacity: 0.55,
    ...Platform.select({
      ios: {
        shadowColor: '#FFB300',
        shadowOpacity: 0.7,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,225,150,0.6)',
    ...Platform.select({
      ios: {
        shadowColor: '#FF9500',
        shadowOpacity: 0.55,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  highlight: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: '55%',
    borderTopWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  locked: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
  },
});
