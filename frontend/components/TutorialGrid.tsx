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
}

async function searchExercises(q: string, limit: number): Promise<Exercise[]> {
  if (!q || !q.trim()) return [];
  try {
    const res = await fetch(`${API_URL}/api/exercises/search?q=${encodeURIComponent(q)}&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.exercises || []) as Exercise[];
  } catch {
    return [];
  }
}

// Live tutorial suggestions from the exercise library API — sources the true,
// current library (not a stale seed), so we surface a demo whenever one exists.
export default function TutorialGrid({ movements, single, onOpen }: TutorialGridProps) {
  const [items, setItems] = useState<Exercise[] | null>(null);
  const namesKey = movements.map(m => m.name).join('|');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const seen = new Set<string>();
      const out: Exercise[] = [];
      const add = (ex?: Exercise) => {
        if (ex && ex._id && !seen.has(ex._id) && out.length < 4) { seen.add(ex._id); out.push(ex); }
      };
      if (single && movements[0]) {
        (await searchExercises(movements[0].name, 6)).forEach(add);
      } else {
        // best demo per movement first
        for (const mv of movements.slice(0, 4)) {
          const r = await searchExercises(mv.name, 2);
          add(r[0]);
        }
        // pad so there are always at least two options when the library has them
        if (out.length < 2) {
          for (const mv of movements) {
            (await searchExercises(mv.name, 4)).forEach(add);
            if (out.length >= 4) break;
          }
        }
      }
      if (!cancelled) setItems(out);
    })();
    return () => { cancelled = true; };
  }, [namesKey, single]);

  if (items === null) {
    return (
      <View style={styles.section}>
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
