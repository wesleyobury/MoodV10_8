import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../utils/apiConfig';
import { cloudinaryThumbnailUrlFromVideoUrl } from '../utils/cloudinaryVideo';
import type { Exercise } from './ExerciseLookupSheet';

interface TutorialGridProps {
  movements: { name: string }[];
  single: boolean;
  onOpen: (ex: Exercise) => void;
  workoutTitle?: string;
  equipment?: string;
}

// Words that don't identify the exercise (stripped so we key off real nouns).
const STOP = new Set([
  'the', 'and', 'with', 'a', 'to', 'x', 'per', 'each', 'rep', 'reps', 'set', 'sets', 'of', 'for', 'your', 'or',
  'high', 'low', 'mid', 'tempo', 'control', 'controlled', 'slow', 'fast', 'paused', 'pause', 'eccentric',
  'isometric', 'iso', 'hold', 'holds', 'strict', 'standing', 'seated', 'alternating', 'machine', 'weighted',
  'light', 'heavy', 'burnout', 'drop', 'final', 'single', 'arm', 'side', 'leg', 'legs', 'partial', 'deep',
  'assisted', 'explosive', 'bodyweight', 'max', 'min', 'sec', 'second', 'seconds', 'rounds', 'round',
]);

const tokens = (s: string): string[] =>
  (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(Boolean);
const nouns = (s: string): string[] => tokens(s).filter(t => t.length >= 3 && !STOP.has(t));

async function searchExercises(q: string, limit: number): Promise<Exercise[]> {
  if (!q || q.trim().length < 3) return [];
  try {
    const res = await fetch(`${API_URL}/api/exercises/search?q=${encodeURIComponent(q.trim())}&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.exercises || []) as Exercise[];
  } catch {
    return [];
  }
}

// Live tutorial suggestions: gather a candidate pool from the words across the
// workout title + movement(s) + equipment, then show the 4 with the most name
// overlap. Backend search is word-boundary, so single-word queries recall well.
export default function TutorialGrid({ movements, single, onOpen, workoutTitle, equipment }: TutorialGridProps) {
  const [items, setItems] = useState<Exercise[] | null>(null);
  const key = movements.map(m => m.name).join('|') + '::' + (workoutTitle || '') + '::' + (equipment || '');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // fields we rank overlap against — movement nouns weighted highest
      const moveTokens = new Set(movements.flatMap(m => nouns(m.name)));
      const fieldTokens = new Set<string>([
        ...moveTokens,
        ...nouns(workoutTitle || ''),
        ...nouns(equipment || ''),
      ]);

      // candidate pool: query each field word (recall) + the full movement names
      const terms = [
        ...movements.map(m => m.name),
        ...[...fieldTokens],
        workoutTitle,
      ].map(t => (t || '').trim().toLowerCase()).filter((t, i, a) => t.length >= 3 && a.indexOf(t) === i);

      const lists = await Promise.all(terms.slice(0, 8).map(t => searchExercises(t, 8)));
      const pool = new Map<string, Exercise>();
      for (const list of lists) for (const ex of list) if (ex && ex._id && !pool.has(ex._id)) pool.set(ex._id, ex);

      // rank by naming overlap across all fields (movement matches weighted 2x)
      const scored = [...pool.values()].map((ex) => {
        const exTokens = new Set([...nouns(ex.name), ...((ex.aliases || []).flatMap(nouns))]);
        let score = 0;
        exTokens.forEach((t) => { if (moveTokens.has(t)) score += 2; else if (fieldTokens.has(t)) score += 1; });
        return { ex, score };
      }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

      if (!cancelled) setItems(scored.slice(0, 4).map(x => x.ex));
    })();
    return () => { cancelled = true; };
  }, [key, single]);

  if (items === null) {
    return (
      <View style={styles.section}>
        <View style={styles.divider} />
        <Text style={styles.header}>Closest matching tutorials</Text>
        <View style={styles.grid}>
          <View style={[styles.card, styles.skeleton]} />
          <View style={[styles.card, styles.skeleton]} />
        </View>
      </View>
    );
  }
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.divider} />
      <Text style={styles.header}>Closest matching tutorials</Text>
      <Text style={styles.sub}>Reference demos — they may differ from the exact movement.</Text>
      <View style={styles.grid}>
        {items.map((ex) => {
          const thumb = ex.thumbnail_url || cloudinaryThumbnailUrlFromVideoUrl(ex.video_url);
          return (
            <TouchableOpacity key={ex._id} style={styles.card} activeOpacity={0.85} onPress={() => onOpen(ex)}>
              <View style={styles.thumbWrap}>
                <Image source={{ uri: thumb }} style={styles.thumb} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                <View style={styles.play}><Ionicons name="play" size={15} color="#0b0b0d" style={{ marginLeft: 2 }} /></View>
              </View>
              <Text style={styles.title} numberOfLines={2}>{ex.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 22 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 18,
  },
  header: { fontSize: 15, fontWeight: '600', color: '#f4f4f5' },
  sub: { fontSize: 12, color: '#7a7a82', marginTop: 3, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48.5%', marginBottom: 14 },
  skeleton: { height: 118, borderRadius: 12, backgroundColor: '#161619' },
  thumbWrap: { position: 'relative', width: '100%', aspectRatio: 16 / 10, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1a1f' },
  thumb: { width: '100%', height: '100%' },
  play: {
    position: 'absolute', top: '50%', left: '50%', width: 40, height: 40, borderRadius: 20,
    marginTop: -20, marginLeft: -20, backgroundColor: 'rgba(244,244,245,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 13, color: '#dcdce2', marginTop: 7, lineHeight: 17 },
});
