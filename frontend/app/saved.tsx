/**
 * Saved (Profile > Saved): workouts saved from the V3 Cart (bookmark), plus older saved workouts.
 *
 *   V3 save      a fresh copy of the saved plan opens in the V3 Cart (POST /repeat), so it can be done and logged again
 *   featured     the featured workout page
 *   custom (V2)  loads into the cart, as before
 * Long-press or the x removes an entry. Store: /api/saved-workouts (utils/v3Saved writes V3 entries).
 */
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/brand';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { apiFetch } from '../utils/api';
import { repeatV3Workout } from '../utils/v3Api';
import { SavedWorkout, fetchSaved } from '../utils/v3Saved';
import { trackEvent } from '../utils/analytics';
import { V3_ASSETS } from '../components/v3/v3Images';
import GuestGate from '../components/GuestGate';

function directionOf(s: SavedWorkout): 'strength' | 'sweat' | 'athletic' | null {
  // V3 saves carry the Direction on every row (workoutType) and at the start of the name (utils/v3SavedBody)
  const t = `${s.workouts[0]?.workoutType ?? ''} ${s.name ?? ''}`.toLowerCase();
  if (t.includes('sweat')) return 'sweat';
  if (t.includes('athletic')) return 'athletic';
  if (t.includes('strength')) return 'strength';
  return null;
}

function SavedScreenScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { addToCart } = useCart();
  const [items, setItems] = useState<SavedWorkout[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const s = await fetchSaved(token);
    setItems(s ?? []);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const open = async (s: SavedWorkout) => {
    if (opening) return;
    if (token) trackEvent(token, 'saved_workout_opened', { surface: 'saved', source: s.source });
    if (s.source === 'v3' && s.featured_workout_id) {
      setOpening(s.id);
      const r = token ? await repeatV3Workout(token, s.featured_workout_id) : null;
      setOpening(null);
      const openId = r && r.ok && r.envelope.workout?.workout_id ? r.envelope.workout.workout_id : s.featured_workout_id;
      router.push({ pathname: '/v3/workout', params: { id: openId, saved: s.id } } as any);
    } else if (s.source === 'featured' && s.featured_workout_id) {
      router.push({ pathname: '/featured-workout-detail', params: { id: s.featured_workout_id } } as any);
    } else {
      s.workouts.forEach((e) =>
        addToCart({
          id: `${e.name}-${Date.now()}-${Math.random()}`, name: e.name, duration: e.duration, description: e.description || '', battlePlan: e.battlePlan || '',
          imageUrl: e.imageUrl || '', intensityReason: e.intensityReason || '', equipment: e.equipment, difficulty: e.difficulty,
          workoutType: e.workoutType || '', moodCard: e.moodCard || '', moodTips: e.moodTips || [],
        } as any),
      );
      router.push('/cart');
    }
  };

  const remove = (s: SavedWorkout) => {
    Alert.alert('Remove saved workout?', s.title || s.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          const res = await apiFetch(`/api/saved-workouts/${encodeURIComponent(s.id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) setItems((cur) => (cur ?? []).filter((x) => x.id !== s.id));
        },
      },
    ]);
  };

  const sorted = useMemo(() => [...(items ?? [])].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')), [items]);

  return (
    <View style={styles.root} testID="saved-screen">
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={COLORS.accent} />}
      >
        <Text style={styles.title}>Saved</Text>
        <Text style={styles.sub}>{items ? `${items.length} workout${items.length === 1 ? '' : 's'}` : ' '}</Text>
        {!items ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <View style={[styles.card, styles.empty]}>
            <Ionicons name="bookmark-outline" size={22} color="rgba(255,255,255,0.5)" />
            <Text style={styles.emptyTitle}>Nothing saved yet</Text>
            <Text style={styles.emptySub}>Tap the bookmark on any workout to keep it here and do it again any time.</Text>
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 16 }}>
            {sorted.map((s) => {
              const dir = directionOf(s);
              const img = dir ? V3_ASSETS[dir === 'athletic' ? 'athletic' : dir] : null;
              return (
                <Pressable key={s.id} onPress={() => open(s)} onLongPress={() => remove(s)} style={({ pressed }) => [styles.card, styles.row, pressed && { opacity: 0.85 }]} testID={`saved-${s.id}`}>
                  {img ? (
                    <Image source={img as any} style={styles.thumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.thumb, styles.thumbFallback]}>
                      <Ionicons name={s.source === 'featured' ? 'star' : 'barbell'} size={20} color={COLORS.accent} />
                    </View>
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {s.source === 'v3' && s.title ? s.title : s.name}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {[dir ? dir[0].toUpperCase() + dir.slice(1) : null, `${s.workouts.length} exercises`, s.total_duration ? `${s.total_duration} min` : null].filter(Boolean).join(' · ')}
                    </Text>
                    <Text style={styles.rowCta}>{opening === s.id ? 'Opening…' : 'Open workout →'}</Text>
                  </View>
                  <Pressable onPress={() => remove(s)} hitSlop={10} accessibilityLabel="Remove saved workout" style={{ padding: 4 }}>
                    <Ionicons name="close" size={17} color="rgba(255,255,255,0.4)" />
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  top: { paddingHorizontal: 12, paddingBottom: 4 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.9, marginTop: 6 },
  sub: { fontSize: 13.5, color: '#8D8D90', marginTop: 3, fontWeight: '500' },
  card: { borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  thumb: { width: 64, height: 80, borderRadius: 12, backgroundColor: '#161616' },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15.5, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.2 },
  rowMeta: { fontSize: 12.5, color: '#8D8D90', marginTop: 3 },
  rowCta: { fontSize: 13, fontWeight: '700', color: COLORS.accent, marginTop: 8 },
  empty: { alignItems: 'center', padding: 26, marginTop: 20, gap: 6 },
  emptyTitle: { fontSize: 15.5, fontWeight: '700', color: COLORS.textPrimary },
  emptySub: { fontSize: 13, color: '#8D8D90', textAlign: 'center', lineHeight: 18 },
});


/** Workouts need a profile: guests get the sign-up prompt (components/GuestGate). */
export default function SavedScreen() {
  const { isGuest } = useAuth();
  if (isGuest) return <GuestGate action="save workouts" />;
  return <SavedScreenScreen />;
}
