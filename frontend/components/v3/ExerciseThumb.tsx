/**
 * ExerciseThumb — exercise media tile. Uses the library thumbnail when the API
 * returns one; when `media` is null (common today) it renders an intentional
 * monogram tile, never a broken image or empty video frame.
 */
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { COLORS } from '../../constants/brand';
import { hasVideo, initials, thumbnailUrl } from '../../utils/v3OverviewFormat';

interface Props {
  item: { exercise?: { name?: string; media?: any } | null };
  size?: number;
}

export function ExerciseThumb({ item, size = 52 }: Props) {
  const uri = thumbnailUrl(item as any);
  const [failed, setFailed] = useState(false);
  const video = hasVideo(item as any);
  const radius = Math.round(size * 0.27);
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: radius }]}>
      {uri && !failed ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" onError={() => setFailed(true)} />
      ) : (
        <LinearGradient
          colors={['#262626', '#141414']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={[styles.mono, { fontSize: Math.round(size * 0.3) }]}>{initials(item.exercise?.name ?? '')}</Text>
        </LinearGradient>
      )}
      {video && uri && !failed ? (
        <View style={styles.play}>
          <Ionicons name="play" size={10} color={COLORS.textPrimary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    backgroundColor: '#161616',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  mono: { color: 'rgba(255,255,255,0.62)', fontWeight: '700', letterSpacing: 0.5 },
  play: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
});
