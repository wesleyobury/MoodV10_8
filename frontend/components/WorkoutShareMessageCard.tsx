import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';

export interface WorkoutShareAttachment {
  workout?: {
    name?: string;
    imageUrl?: string;
    duration?: string;
    description?: string;
    [key: string]: any;
  };
  equipment?: string;
  difficulty?: string;
  mood_category?: string;
  subtext?: string;
  workout_name?: string;
}

interface Props {
  attachment: WorkoutShareAttachment;
  isOwn: boolean;
}

/**
 * Premium share-card rendered inside chat threads when a user sends a workout.
 *
 * Title    = mood category (the "Mood card" the cart was created from), or
 *            the workout name if mood_category is missing.
 * Subtext  = sub-path (muscle group / cardio-vs-light-weight / bodyweight-vs-weighted).
 *            Empty for Outdoors / Calisthenics by spec.
 * Tapping  = opens /shared-workout with the encoded payload, restoring the
 *            full workout cart in its original state.
 */
export default function WorkoutShareMessageCard({ attachment, isOwn }: Props) {
  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1,
      speed: 14,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  }, []);

  const workout = attachment?.workout || {};
  const title = (attachment?.mood_category && attachment.mood_category.trim())
    || workout.name
    || attachment?.workout_name
    || 'Workout';
  const subtext = (attachment?.subtext || '').trim();
  const workoutName = workout.name || attachment?.workout_name || '';
  const imageUrl = workout.imageUrl || '';
  const duration = workout.duration || '';
  const difficulty = (attachment?.difficulty || '').toUpperCase();

  const handlePress = () => {
    try {
      const payload = encodeURIComponent(JSON.stringify(attachment));
      router.push({
        pathname: '/shared-workout',
        params: { payload },
      });
    } catch (e) {
      console.warn('Failed to open shared workout:', e);
    }
  };

  const opacity = enterAnim;
  const translateY = enterAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        isOwn ? styles.ownAlign : styles.otherAlign,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={styles.card}
        testID="workout-share-card"
      >
        {/* Top media banner */}
        <View style={styles.media}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Ionicons name="fitness" size={36} color="#FFD700" />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.78)']}
            style={styles.imageGradient}
          />
          {/* Floating "Workout" pill */}
          <View style={styles.pill}>
            <Ionicons name="paper-plane" size={11} color="#0c0c0c" />
            <Text style={styles.pillText}>WORKOUT</Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {!!subtext && <Text style={styles.subtext} numberOfLines={1}>{subtext}</Text>}

          {/* Workout name (small) + meta */}
          {!!workoutName && workoutName !== title && (
            <Text style={styles.workoutName} numberOfLines={1}>{workoutName}</Text>
          )}
          <View style={styles.metaRow}>
            {!!duration && (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={11} color="#FFD700" />
                <Text style={styles.metaChipText}>{duration}</Text>
              </View>
            )}
            {!!difficulty && (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>{difficulty}</Text>
              </View>
            )}
            <View style={styles.openHint}>
              <Text style={styles.openHintText}>Tap to view</Text>
              <Ionicons name="chevron-forward" size={12} color="#888" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: 6, paddingHorizontal: 4, maxWidth: '85%' },
  ownAlign: { alignSelf: 'flex-end' },
  otherAlign: { alignSelf: 'flex-start' },
  card: {
    width: 280,
    backgroundColor: '#0e0e0e',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.18)',
  },
  media: { width: '100%', height: 132, backgroundColor: '#111' },
  image: { width: '100%', height: '100%' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  imageGradient: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%',
  },
  pill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    color: '#0c0c0c',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  body: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  subtext: { color: '#FFD700', fontSize: 12, fontWeight: '600', marginTop: 2 },
  workoutName: { color: '#888', fontSize: 12, marginTop: 6 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161616',
    borderColor: '#222',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaChipText: { color: '#cfcfcf', fontSize: 10, fontWeight: '600' },
  openHint: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  openHintText: { color: '#666', fontSize: 11 },
});
