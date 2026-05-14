import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../utils/apiConfig';
import { Analytics } from '../utils/analytics';
import { useCart } from '../contexts/CartContext';

// ===== Brand tokens =====
const GOLD = '#F5C518';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#A0A0A0';
const TEXT_TERTIARY = '#6B6B6B';
const SURFACE = '#141414';
const BORDER = '#1F1F1F';

// ===== Mood palettes (dark, desaturated) =====
type MoodBucket = 'sweat' | 'muscle' | 'explosive' | 'lazy' | 'calisthenics' | 'outdoor';

const MOOD_STYLES: Record<MoodBucket, { bg: string; accent: string }> = {
  sweat: { bg: '#1F0F0B', accent: '#E27457' },
  muscle: { bg: '#1A1715', accent: '#D9CDB8' },
  explosive: { bg: '#15102A', accent: '#9B8AE0' },
  lazy: { bg: '#0F1F1A', accent: '#5FA68A' },
  calisthenics: { bg: '#0E1620', accent: '#6B9CD9' },
  outdoor: { bg: '#1F1A0B', accent: '#B89A5F' },
};

const MOOD_NAV: Record<MoodBucket, { pathname: string; title: string }> = {
  sweat: { pathname: '/workout-type', title: 'Sweat / burn fat' },
  muscle: { pathname: '/body-parts', title: 'Muscle gainer' },
  explosive: { pathname: '/explosiveness-type', title: 'Build explosion' },
  lazy: { pathname: '/lazy-training-type', title: "I'm feeling lazy" },
  calisthenics: { pathname: '/calisthenics-equipment', title: 'I want to do calisthenics' },
  outdoor: { pathname: '/outdoor-equipment', title: 'I want to get outside' },
};

interface LiveEntry {
  id: string;
  type: 'live_now' | 'completion' | 'milestone';
  user: { id: string; username: string; name: string; avatar: string };
  mood_bucket: MoodBucket;
  mood_label: string;
  workout_name: string | null;
  duration_minutes: number | null;
  milestone_count: number | null;
  timestamp: string;
  ago_text: string;
  // Phase 7 — surfaced from completion event metadata so Try-this-workout
  // can hydrate the viewer's cart with the exact exercises the original
  // athlete ran (instead of dumping them into mood sub-selection).
  workout_snapshot_id?: string | null;
}

interface LiveFeedData {
  stats: { sessions_today: number; most_common_mood: string | null };
  entries: LiveEntry[];
}

// Turn 0xRRGGBB + alpha (0..1) into rgba(...)
const withAlpha = (hex: string, alpha: number): string => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ===== Pulsing gold dot — used for LIVE label and stat header =====
const PulseDot: React.FC<{ size?: number; color?: string }> = ({ size = 6, color = GOLD }) => {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.25, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
      }}
    />
  );
};

// ===== Card for a single feed entry =====
const FeedCard: React.FC<{ entry: LiveEntry; onPress: (entry: LiveEntry) => void }> = ({ entry, onPress }) => {
  const palette = MOOD_STYLES[entry.mood_bucket] || MOOD_STYLES.muscle;
  // Semi-transparent: blend palette bg with #000 by lowering alpha
  const semiBg = withAlpha(palette.accent, 0.06); // very subtle accent wash on near-black
  const cardBg = palette.bg; // already dark, semi-tinted feel by design

  const showLabel = entry.type === 'live_now' || entry.type === 'milestone';
  const labelText = entry.type === 'live_now' ? 'LIVE NOW' : entry.type === 'milestone' ? 'MILESTONE' : '';
  const labelColor = entry.type === 'milestone' ? GOLD : withAlpha(palette.accent, 0.7);

  // Sentence builder
  const userName = entry.user.name || entry.user.username || 'Someone';
  let sentence = '';
  if (entry.type === 'live_now') {
    sentence = `${userName} just started ${entry.workout_name ? `a ${entry.workout_name}` : `a ${entry.mood_label.toLowerCase()} workout`}`;
  } else if (entry.type === 'completion') {
    const dur = entry.duration_minutes ? `${entry.duration_minutes}-min ` : '';
    const wname = entry.workout_name || entry.mood_label;
    sentence = `${userName} finished a ${dur}${wname}`;
  } else if (entry.type === 'milestone') {
    sentence = `${userName} reached a new mark`;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(entry)}
      style={[styles.card, { backgroundColor: cardBg }]}
      data-testid={`live-feed-card-${entry.type}-${entry.id}`}
    >
      {/* subtle accent wash to lift card off the black background */}
      <View pointerEvents="none" style={[styles.cardAccentWash, { backgroundColor: semiBg }]} />

      {/* User avatar — small circular pic at the top-right corner so the
          existing copy + LIVE/MILESTONE label below it don't get pushed
          around. Falls back to an initial-letter circle when the user
          hasn't uploaded an avatar. */}
      <View style={styles.cardAvatar} pointerEvents="none">
        {entry.user.avatar ? (
          <Image
            source={{ uri: entry.user.avatar }}
            style={styles.cardAvatarImg}
            data-testid={`live-feed-avatar-${entry.id}`}
          />
        ) : (
          <View
            style={[
              styles.cardAvatarImg,
              styles.cardAvatarFallback,
              { borderColor: withAlpha(palette.accent, 0.4) },
            ]}
            data-testid={`live-feed-avatar-fallback-${entry.id}`}
          >
            <Text style={[styles.cardAvatarFallbackText, { color: palette.accent }]}>
              {(userName[0] || '?').toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {showLabel && (
        <View style={styles.labelRow}>
          {entry.type === 'live_now' && <PulseDot size={5} color={GOLD} />}
          <Text
            style={[
              styles.labelText,
              { color: labelColor, marginLeft: entry.type === 'live_now' ? 6 : 0 },
            ]}
          >
            {labelText}
          </Text>
        </View>
      )}

      {entry.type === 'milestone' ? (
        <Text style={styles.milestoneNumber} data-testid={`live-milestone-count-${entry.id}`}>
          {entry.milestone_count} workouts
        </Text>
      ) : (
        <Text style={[styles.moodWord, { color: palette.accent }]} data-testid={`live-mood-${entry.mood_bucket}-${entry.id}`}>
          {entry.mood_label}
        </Text>
      )}

      <Text style={styles.sentence}>{sentence}</Text>

      <View style={styles.bottomRow}>
        <Text style={[styles.timestamp, { color: withAlpha(palette.accent, 0.5) }]}>
          {entry.ago_text}
        </Text>

        <View style={[styles.tryButton, { borderColor: withAlpha(palette.accent, 0.35) }]}>
          <Ionicons name="chevron-forward" size={11} color={palette.accent} />
          <Text style={[styles.tryButtonText, { color: palette.accent }]}>Try this workout</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ===== Main Live Feed =====
interface LiveFeedProps {
  token: string | null;
}

const LiveFeed: React.FC<LiveFeedProps> = ({ token }) => {
  const [data, setData] = useState<LiveFeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { clearCart, addToCart } = useCart();

  // Track previously-seen entry IDs so we can detect "+N just landed" on refresh
  const seenIdsRef = useRef<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(-12)).current;
  const isFirstLoadRef = useRef(true);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    Animated.parallel([
      Animated.timing(toastOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(toastTranslateY, { toValue: 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    // Auto-hide after 2.5s
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(toastTranslateY, { toValue: -12, duration: 220, useNativeDriver: true }),
      ]).start(() => setToastMessage(null));
    }, 2500);
  }, [toastOpacity, toastTranslateY]);

  const fetchFeed = useCallback(async (isManualRefresh: boolean = false) => {
    try {
      const res = await fetch(`${API_URL}/api/feed/live?limit=30`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as LiveFeedData;

      // Detect newly-arrived entries (not seen on previous fetch)
      const previouslySeen = seenIdsRef.current;
      const newEntries = (json.entries || []).filter((e) => !previouslySeen.has(e.id));
      const isFirst = isFirstLoadRef.current;

      // Update seen set with current entries
      seenIdsRef.current = new Set((json.entries || []).map((e) => e.id));
      setData(json);

      // Toast logic — skip on the very first load (everything would be "new")
      if (!isFirst && newEntries.length > 0) {
        const msg = newEntries.length === 1
          ? '+1 just landed'
          : `+${newEntries.length} just landed`;
        showToast(msg);
        // Soft haptic when new content arrives during a manual refresh
        if (isManualRefresh && Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      }
      isFirstLoadRef.current = false;
    } catch (err) {
      console.warn('LiveFeed fetch error:', err);
      setData({ stats: { sessions_today: 0, most_common_mood: null }, entries: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    fetchFeed(false);
  }, [fetchFeed]);

  // Poll every 30s while screen is focused
  useFocusEffect(
    useCallback(() => {
      const id = setInterval(() => fetchFeed(false), 30000);
      return () => clearInterval(id);
    }, [fetchFeed])
  );

  const handleCardPress = useCallback(
    async (entry: LiveEntry) => {
      const nav = MOOD_NAV[entry.mood_bucket] || MOOD_NAV.muscle;

      // Phase 7 — if the original completion event carried a snapshot ID,
      // hydrate the viewer's cart with the exact exercises the original
      // athlete ran, then route straight to /cart (mirrors the Explore
      // tab's "Try this workout" replicate behavior). Falls back to the
      // mood sub-selection nav if the snapshot fetch fails for any reason.
      if (entry.workout_snapshot_id) {
        try {
          const res = await fetch(
            `${API_URL}/api/workout-snapshots/${entry.workout_snapshot_id}`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} },
          );
          if (res.ok) {
            const snap = await res.json();
            const cartItems = Array.isArray(snap?.workouts) ? snap.workouts : [];
            if (cartItems.length > 0) {
              clearCart();
              cartItems.forEach((w: any) => addToCart(w));
              if (token) {
                Analytics.tryWorkoutClicked(token, {
                  workout_name: entry.workout_name || entry.mood_label,
                  mood_category: nav.title,
                  source: 'live_feed_snapshot',
                });
              }
              router.push('/cart');
              return;
            }
          }
        } catch {
          /* fall through to legacy mood sub-selection nav */
        }
      }

      if (token) {
        Analytics.tryWorkoutClicked(token, {
          workout_name: entry.workout_name || entry.mood_label,
          mood_category: nav.title,
          source: 'live_feed',
        });
      }
      router.push({ pathname: nav.pathname as any, params: { mood: nav.title } });
    },
    [router, token, clearCart, addToCart]
  );

  const onRefresh = () => {
    setRefreshing(true);
    // Tap haptic on pull-to-refresh trigger
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    fetchFeed(true);
  };

  const entries = data?.entries || [];
  const stats = data?.stats || { sessions_today: 0, most_common_mood: null };

  // ===== Empty state =====
  if (!loading && entries.length < 5) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}
      >
        <StatHeader sessions={stats.sessions_today} mood={stats.most_common_mood} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText} data-testid="live-feed-empty">
            Quiet right now — be the first today
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color={GOLD} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Floating "+N just landed" toast */}
      {toastMessage !== null && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
            },
          ]}
          data-testid="live-feed-new-entries-toast"
        >
          <View style={styles.toastDot} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}
        data-testid="live-feed-scroll"
      >
        <StatHeader sessions={stats.sessions_today} mood={stats.most_common_mood} />
        <View style={{ paddingHorizontal: 16 }}>
          {entries.map((entry) => (
            <FeedCard key={entry.id} entry={entry} onPress={handleCardPress} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// ===== Stat header =====
const StatHeader: React.FC<{ sessions: number; mood: string | null }> = ({ sessions, mood }) => (
  <View style={styles.statHeaderWrap}>
    <View style={styles.statHeader} data-testid="live-feed-stat-header">
      <View style={styles.statHeaderDot}>
        <PulseDot size={6} color={GOLD} />
      </View>
      <View style={styles.statHeaderRow}>
        <View style={styles.statHeaderLeft}>
          <Text style={styles.statBigNumber} data-testid="live-stat-sessions-today">
            {sessions}
          </Text>
          <Text style={styles.statSubtext}>sessions today</Text>
        </View>
        <View style={styles.statHeaderRight}>
          <Text style={styles.statRightTop} data-testid="live-stat-most-common-mood">
            {mood || '—'}
          </Text>
          <Text style={styles.statSubtext}>most common mood</Text>
        </View>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stat header
  statHeaderWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  statHeader: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 18,
    paddingVertical: 16,
    position: 'relative',
  },
  statHeaderDot: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  // Per-card user avatar (top-right of the card body)
  cardAvatar: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  cardAvatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  cardAvatarFallback: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarFallbackText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  statHeaderLeft: {
    flex: 1,
  },
  statHeaderRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  statBigNumber: {
    color: TEXT_PRIMARY,
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 42,
    letterSpacing: -1,
  },
  statRightTop: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '500',
  },
  statSubtext: {
    color: TEXT_SECONDARY,
    fontSize: 11,
    marginTop: 4,
  },

  // Cards
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  cardAccentWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
  },
  moodWord: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 26,
    marginBottom: 6,
  },
  milestoneNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    lineHeight: 34,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  sentence: {
    color: '#C9C9C9',
    fontSize: 13,
    lineHeight: 20, // 1.5+ line height
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 11,
  },
  tryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  tryButtonText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 3,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    textAlign: 'center',
  },

  // Floating "+N just landed" toast
  toast: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderColor: 'rgba(245, 197, 24, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    zIndex: 100,
  },
  toastDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GOLD,
    marginRight: 8,
  },
  toastText: {
    color: TEXT_PRIMARY,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default LiveFeed;
