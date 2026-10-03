/**
 * The "Badge unlocked" card the toast host shows (contexts/AchievementsContext). Founder pass, Oct 2026: a neutral raised
 * surface (no gold border or wash, per the design rules), the coin larger with one light sweep across it as it lands, the
 * tier plate on the coin, then BADGE UNLOCKED · category, the badge name and its line.
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import AchievementMedallion, { achievementValue } from './AchievementMedallion';
import { Shimmer } from './v3/Shimmer';
import { COLORS } from '../constants/brand';
import type { AchievementDef } from '../constants/achievements';

const CATEGORY: Record<string, string> = {
  streak: 'Streak',
  consistency: 'Consistency',
  volume: 'Milestone',
  difficulty: 'Intensity',
  mood: 'Mood',
  social: 'Community',
};

export function AchievementToastCard({ def }: { def: Pick<AchievementDef, 'id' | 'icon' | 'label' | 'description' | 'category'> }) {
  const size = 58;
  return (
    <View style={styles.card} testID="achievement-toast">
      <View style={{ width: size, height: size }}>
        <AchievementMedallion icon={def.icon as any} size={size} value={achievementValue(def.id)} />
        {/* one sweep of light across the face as the coin lands */}
        <View style={[styles.clip, { width: size * 0.78, height: size * 0.78, borderRadius: size * 0.39, left: size * 0.11, top: size * 0.11 }]} pointerEvents="none">
          <Shimmer size={size * 0.78} offset={250} pause={60000} duration={900} strength={0.6} />
        </View>
      </View>
      <View style={styles.text}>
        <Text style={styles.eyebrow} numberOfLines={1}>
          BADGE UNLOCKED{CATEGORY[def.category] ? <Text style={styles.cat}>{`  ·  ${CATEGORY[def.category].toUpperCase()}`}</Text> : null}
        </Text>
        <Text style={styles.title} numberOfLines={1}>{def.label}</Text>
        <Text style={styles.desc} numberOfLines={2}>{def.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(24,24,27,0.97)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    ...(Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 22, shadowOffset: { width: 0, height: 14 } },
      android: { elevation: 14 },
      default: {},
    }) as object),
  },
  clip: { position: 'absolute', overflow: 'hidden' },
  text: { flex: 1, minWidth: 0 },
  eyebrow: { color: COLORS.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 3 },
  cat: { color: 'rgba(255,255,255,0.45)', fontWeight: '700' },
  title: { color: '#FFFFFF', fontSize: 16.5, fontWeight: '800', letterSpacing: -0.2 },
  desc: { color: 'rgba(255,255,255,0.62)', fontSize: 12.5, fontWeight: '500', marginTop: 2, lineHeight: 17 },
});
