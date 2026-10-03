/**
 * ExerciseThumb — exercise image tile. Founder edit pass: static imagery first (MOOD's own exercise/workout images,
 * utils/v3ExerciseImages), else an intentional monogram tile. Video thumbnails are never used as images;
 * the play badge is opt-in (the detail sheet's demo), not shown on Cart rows.
 */
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { COLORS } from '../../constants/brand';
import { hasVideo, initials } from '../../utils/v3OverviewFormat';
import { exerciseImageUrl } from '../../utils/v3ExerciseImages';
import { optimizedImageUrl } from '../../utils/cloudinaryImage';

interface Props {
  item: { exercise?: { id?: string; name?: string; media?: any } | null };
  size?: number;
  /** Show the small play badge when the library has a demo video (detail surfaces only). */
  showPlay?: boolean;
}

export function ExerciseThumb({ item, size = 52, showPlay = false }: Props) {
  const raw = exerciseImageUrl(item as any);
  const uri = raw ? optimizedImageUrl(raw, size * 3) : null;
  const [failed, setFailed] = useState(false);
  const video = showPlay && hasVideo(item as any);
  const radius = Math.round(size * 0.27);
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: radius }]}>
      {uri && !failed ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" onError={() => setFailed(true)} />
      ) : (
        <LinearGradient
          colors={[COLORS.surfaceElevated, COLORS.surface]}
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
    backgroundColor: COLORS.surface,
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
