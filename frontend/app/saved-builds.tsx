/**
 * Saved Builds screen — list of in_progress, ready_to_start, and started drafts
 * for the current identity (user or guest device).
 *
 * Gestures:
 *   - Swipe row to delete
 *   - Long-press to toggle pin (max 3 pinned per identity, enforced by backend)
 *   - Tap to resume:
 *     • If status === 'ready_to_start' → /cart (workout preview)
 *     • Else → draft.resume_route + resume_params (the step they left)
 *   - If draft.created_at > 7d ago → stale prompt before navigation
 *
 * Empty state: "No saved builds yet."
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import BackButton from '../components/BackButton';
import { useDrafts, WorkoutDraft } from '../contexts/DraftsContext';

// ===== Visual constants — match existing design system =====
const COLORS = {
  bg: '#0A0A0A',
  card: '#141414',
  cardBorder: '#1F1F1F',
  text: '#FFFFFF',
  textDim: '#B7B7B7',
  textMuted: '#6B6B6B',
  gold: '#F5C518',
  danger: '#E25757',
  green: '#3FBF7F',
  blue: '#5FA6E0',
};

// Mood → palette/icon (matches the home Mood color codebook)
const MOOD_META: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; tag: string }> = {
  'Sweat': { color: '#E27457', icon: 'flame', tag: 'SWEAT' },
  'Muscle Gainer': { color: '#D9CDB8', icon: 'barbell', tag: 'MUSCLE GAINER' },
  'Build Explosion': { color: '#9B8AE0', icon: 'flash', tag: 'EXPLOSIVE' },
  "I'm Feeling Lazy": { color: '#5FA68A', icon: 'bed', tag: 'LAZY' },
  'Lazy': { color: '#5FA68A', icon: 'bed', tag: 'LAZY' },
  'Calisthenics': { color: '#6B9CD9', icon: 'body', tag: 'CALISTHENICS' },
  'Outdoor': { color: '#B89A5F', icon: 'leaf', tag: 'OUTDOOR' },
};

const STALE_THRESHOLD_DAYS = 7;

// ===== Helpers =====
const relativeTime = (iso?: string | null): string => {
  if (!iso) return 'just now';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'just now';
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 30) return `${d} days ago`;
  const mo = Math.floor(d / 30);
  return mo === 1 ? '1 month ago' : `${mo} months ago`;
};

const isStale = (iso?: string | null): boolean => {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return (Date.now() - t) > STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
};

const statusPill = (draft: WorkoutDraft): { label: string; bg: string; fg: string } => {
  if (draft.status === 'ready_to_start') {
    return { label: 'Ready to start', bg: 'rgba(63,191,127,0.15)', fg: COLORS.green };
  }
  if (draft.status === 'started') {
    return { label: 'In session', bg: 'rgba(245,197,24,0.15)', fg: COLORS.gold };
  }
  if (draft.status === 'abandoned') {
    return { label: 'Paused', bg: 'rgba(107,107,107,0.15)', fg: COLORS.textDim };
  }
  // in_progress
  const total = Math.max(draft.step_count || 0, draft.current_step || 0);
  const cur = Math.min(draft.current_step || 0, total);
  if (total > 0) {
    return { label: `In progress — ${cur} of ${total} steps`, bg: 'rgba(95,166,224,0.15)', fg: COLORS.blue };
  }
  return { label: 'In progress', bg: 'rgba(95,166,224,0.15)', fg: COLORS.blue };
};

// ===== Stale prompt modal =====
interface StalePromptProps {
  visible: boolean;
  draft: WorkoutDraft | null;
  onUse: () => void;
  onFresh: () => void;
  onCancel: () => void;
}

const StalePrompt: React.FC<StalePromptProps> = ({ visible, draft, onUse, onFresh, onCancel }) => {
  if (!draft) return null;
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={styles.staleBackdrop} onPress={onCancel}>
        <Pressable style={styles.staleSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.staleHeader}>
            <Ionicons name="time-outline" size={22} color={COLORS.gold} />
            <Text style={styles.staleTitle}>Mood may have shifted</Text>
          </View>
          <Text style={styles.staleBody}>
            This build is from {relativeTime(draft.created_at)}. Want to refresh it?
          </Text>
          <View style={styles.staleButtonRow}>
            <TouchableOpacity
              style={[styles.staleButton, styles.staleButtonSecondary]}
              onPress={onUse}
              testID="stale-prompt-use"
            >
              <Text style={styles.staleButtonTextSecondary}>Use this</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.staleButton, styles.staleButtonPrimary]}
              onPress={onFresh}
              testID="stale-prompt-fresh"
            >
              <Text style={styles.staleButtonTextPrimary}>Start fresh</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ===== Single row =====
interface DraftRowProps {
  draft: WorkoutDraft;
  onTap: (draft: WorkoutDraft) => void;
  onDelete: (id: string) => void;
  onLongPress: (draft: WorkoutDraft) => void;
}

const DraftRow: React.FC<DraftRowProps> = ({ draft, onTap, onDelete, onLongPress }) => {
  const mood = MOOD_META[draft.mood_input?.category] || MOOD_META['Sweat'];
  const pill = statusPill(draft);
  const swipeRef = useRef<Swipeable | null>(null);

  const renderRightActions = (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.7],
      extrapolate: 'clamp',
    });
    return (
      <View style={styles.deleteAction}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <TouchableOpacity
            onPress={() => {
              swipeRef.current?.close();
              onDelete(draft.id);
            }}
            style={styles.deleteButton}
            testID={`draft-delete-${draft.id}`}
          >
            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onTap(draft)}
        onLongPress={() => onLongPress(draft)}
        delayLongPress={400}
        style={styles.row}
        testID={`draft-row-${draft.id}`}
      >
        <View style={[styles.thumbWrap, { backgroundColor: `${mood.color}22`, borderColor: `${mood.color}55` }]}>
          {draft.thumbnail_url ? (
            <Image source={{ uri: draft.thumbnail_url }} style={styles.thumb} contentFit="cover" />
          ) : (
            <Ionicons name={mood.icon} size={28} color={mood.color} />
          )}
          {draft.pinned ? (
            <View style={styles.pinBadge}>
              <Ionicons name="bookmark" size={11} color={COLORS.bg} />
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.titleLine}>
            <Text style={[styles.moodTag, { color: mood.color }]} numberOfLines={1}>
              {mood.tag}
            </Text>
            <Text style={styles.timeText}>{relativeTime(draft.last_modified_at)}</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>{draft.title || 'Untitled build'}</Text>
          <View style={[styles.pill, { backgroundColor: pill.bg }]}>
            <Text style={[styles.pillText, { color: pill.fg }]} numberOfLines={1}>{pill.label}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </Swipeable>
  );
};

// ===== Main screen =====
export default function SavedBuildsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { listDrafts, deleteDraft, togglePin, resumeDraft, refreshCount } = useDrafts();

  const [drafts, setDrafts] = useState<WorkoutDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stale, setStale] = useState<WorkoutDraft | null>(null);

  const load = useCallback(async () => {
    const data = await listDrafts({ includeCompleted: false });
    setDrafts(data);
    setLoading(false);
    refreshCount();
  }, [listDrafts, refreshCount]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const navigateToDraft = useCallback(async (draft: WorkoutDraft) => {
    const resumed = await resumeDraft(draft.id);
    if (!resumed) {
      Alert.alert('Could not open', 'This build is no longer available.');
      return;
    }
    // If ready_to_start AND has a generated_workout, route to cart preview
    if (resumed.status === 'ready_to_start' && resumed.generated_workout && resumed.generated_workout.length > 0) {
      router.push('/cart');
      return;
    }
    // Else, route to the step they left
    const route = resumed.resume_route || '/cart';
    try {
      router.push({ pathname: route as any, params: (resumed.resume_params || {}) as any });
    } catch {
      router.push('/cart');
    }
  }, [resumeDraft, router]);

  const handleTap = useCallback(async (draft: WorkoutDraft) => {
    if (isStale(draft.created_at)) {
      setStale(draft);
      return;
    }
    await navigateToDraft(draft);
  }, [navigateToDraft]);

  const handleStaleUse = useCallback(async () => {
    if (!stale) return;
    const target = stale;
    setStale(null);
    await navigateToDraft(target);
  }, [stale, navigateToDraft]);

  const handleStaleFresh = useCallback(async () => {
    if (!stale) return;
    // Mark old as abandoned then route to home for fresh mood pick
    const id = stale.id;
    setStale(null);
    await deleteDraft(id); // hard delete = cleanest "start fresh"
    await load();
    router.push('/(tabs)');
  }, [stale, deleteDraft, load, router]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteDraft(id);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }, [deleteDraft]);

  const handleLongPress = useCallback(async (draft: WorkoutDraft) => {
    // toggle pin (cap of 3 enforced server-side)
    const next = !draft.pinned;
    const updated = await togglePin(draft.id, next);
    if (!updated) {
      Alert.alert('Pin limit reached', 'You can pin up to 3 builds.');
      return;
    }
    setDrafts((prev) => prev.map((d) => (d.id === draft.id ? { ...d, pinned: next } : d)));
  }, [togglePin]);

  const pinned = useMemo(() => drafts.filter((d) => d.pinned), [drafts]);
  const rest = useMemo(() => drafts.filter((d) => !d.pinned), [drafts]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="saved-builds-screen">
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Saved Builds</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
      >
        {loading ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Loading…</Text>
          </View>
        ) : drafts.length === 0 ? (
          <View style={styles.emptyWrap} testID="saved-builds-empty-state">
            <Ionicons name="bookmark-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No saved builds yet.</Text>
            <Text style={styles.emptyBody}>Start a build from your mood — we&apos;ll save it here so you can come back to it.</Text>
            <TouchableOpacity
              style={styles.emptyCTA}
              onPress={() => router.push('/(tabs)')}
              testID="saved-builds-empty-cta"
            >
              <Text style={styles.emptyCTAText}>Pick a MOOD</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {pinned.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>PINNED</Text>
                {pinned.map((d) => (
                  <DraftRow
                    key={d.id}
                    draft={d}
                    onTap={handleTap}
                    onDelete={handleDelete}
                    onLongPress={handleLongPress}
                  />
                ))}
              </View>
            ) : null}
            {rest.length > 0 ? (
              <View style={styles.section}>
                {pinned.length > 0 ? <Text style={styles.sectionLabel}>BUILDS</Text> : null}
                {rest.map((d) => (
                  <DraftRow
                    key={d.id}
                    draft={d}
                    onTap={handleTap}
                    onDelete={handleDelete}
                    onLongPress={handleLongPress}
                  />
                ))}
              </View>
            ) : null}
            <Text style={styles.helpText}>Long-press to pin · swipe left to delete</Text>
          </>
        )}
      </ScrollView>

      <StalePrompt
        visible={stale !== null}
        draft={stale}
        onUse={handleStaleUse}
        onFresh={handleStaleFresh}
        onCancel={() => setStale(null)}
      />
    </View>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  section: {
    marginTop: 18,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 1.6,
    marginBottom: 8,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  thumb: { width: '100%', height: '100%' },
  pinBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.gold,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { flex: 1, marginHorizontal: 12 },
  titleLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  moodTag: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '700',
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  deleteAction: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButton: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    paddingTop: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyBody: {
    color: COLORS.textDim,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyCTA: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyCTAText: {
    color: COLORS.bg,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  helpText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 18,
  },
  staleBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  staleSheet: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
  },
  staleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  staleTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginLeft: 8 },
  staleBody: { color: COLORS.textDim, fontSize: 14, lineHeight: 20, marginBottom: 18 },
  staleButtonRow: { flexDirection: 'row', gap: 10 },
  staleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  staleButtonPrimary: { backgroundColor: COLORS.gold, marginLeft: 5 },
  staleButtonSecondary: {
    backgroundColor: 'transparent',
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    marginRight: 5,
  },
  staleButtonTextPrimary: { color: COLORS.bg, fontWeight: '700', letterSpacing: 0.4 },
  staleButtonTextSecondary: { color: COLORS.text, fontWeight: '600' },
});
