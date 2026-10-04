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
import { Analytics, trackEvent } from '../utils/analytics';
import { useCart } from '../contexts/CartContext';
import AchievementMedallion, { achievementValue } from './AchievementMedallion';
import { BuildPreset, buildPresetParams } from '../utils/v3Explore';
import { Shimmer } from './v3/Shimmer';

// V2.1 — floor on automatic feed toasts. 3 minutes: frequent enough that an
// active feed still feels live, rare enough that it stops being wallpaper.
const TOAST_COOLDOWN_MS = 3 * 60 * 1000;

// ===== Brand tokens =====
const GOLD = '#F5C518';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#A0A0A0';
const TEXT_TERTIARY = '#6B6B6B';
const SURFACE = '#141414';
const BORDER = '#1F1F1F';

// Shared fixed height so every feed card matches the first "sessions today"
// stat card — keeps the feed compact and uniform.
const FEED_CARD_HEIGHT = 104;

/** What this page is (Explore, Oct 2026): a headline and one short line, not a paragraph. */
const LIVE_HEADLINE = 'See who’s training.';
const LIVE_SUBLINE = 'Like what you see? Tap it. MOOD builds your version.';

const Intro: React.FC = () => (
  <View style={styles.intro} data-testid="live-feed-intro">
    <Text style={styles.introHeadline}>{LIVE_HEADLINE}</Text>
    <Text style={styles.introSub}>{LIVE_SUBLINE}</Text>
  </View>
);

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
  type: 'live_now' | 'completion' | 'milestone' | 'badge';
  user: { id: string; username: string; name: string; avatar: string };
  mood_bucket: MoodBucket;
  mood_label: string;
  workout_name: string | null;
  duration_minutes: number | null;
  milestone_count: number | null;
  // v2 gamification — set when type === 'badge'
  badge_id?: string;
  badge_label?: string;
  badge_icon?: string;
  badge_category?: string;
  timestamp: string;
  ago_text: string;
  // Phase 7 — surfaced from completion event metadata so Try-this-workout
  // can hydrate the viewer's cart with the exact exercises the original
  // athlete ran (instead of dumping them into mood sub-selection).
  workout_snapshot_id?: string | null;
  // MOOD V3 (Oct 2026): V3 workouts and sample sessions. Try this workout opens Build with this preset.
  v3_workout_id?: string | null;
  v3_preset?: BuildPreset | null;
  /** a sample session (backend/v3_explore.feed_samples): not a real person */
  sample?: boolean;
  /** production: tag the row SAMPLE and show no name / face */
  show_sample_tag?: boolean;
  /** detail line: States · exercises · sets · level (V3 and sample rows) */
  details?: string[];
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
// ===== Badge unlock card (v2 gamification) — gold, premium, no gold-on-gold =====
export const BadgeCard: React.FC<{ entry: LiveEntry }> = ({ entry }) => {
  const userName = entry.user.name || entry.user.username || 'Someone';
  const icon = (entry.badge_icon as any) || 'trophy';
  return (
    <View style={[styles.card, styles.badgeCard]} data-testid={`live-feed-card-badge-${entry.id}`}>
      {/* founder pass, Oct 2026: the coin carries the tier; the card is a neutral surface like every other card */}
      <View style={styles.badgeRow}>
        <AchievementMedallion icon={icon} size={56} value={entry.badge_id ? achievementValue(entry.badge_id) : null} />
        <View style={styles.badgeTextCol}>
          <Text style={styles.badgeEyebrow} numberOfLines={1}>BADGE EARNED<Text style={styles.badgeAgo}>{entry.ago_text ? `  ·  ${entry.ago_text}` : ''}</Text></Text>
          <Text style={styles.badgeLabel} numberOfLines={1}>{entry.badge_label || 'New badge'}</Text>
          <Text style={styles.sentence} numberOfLines={1}>{userName} earned it</Text>
        </View>
      </View>
    </View>
  );
};

const FeedCard: React.FC<{ entry: LiveEntry; index?: number; onPress: (entry: LiveEntry) => void }> = ({ entry, index = 0, onPress }) => {
  if (entry.type === 'badge') {
    return <BadgeCard entry={entry} />;
  }
  const palette = MOOD_STYLES[entry.mood_bucket] || MOOD_STYLES.muscle;
  // Semi-transparent: blend palette bg with #000 by lowering alpha
  const semiBg = withAlpha(palette.accent, 0.06); // very subtle accent wash on near-black
  const cardBg = palette.bg; // already dark, semi-tinted feel by design

  const showLabel = entry.type === 'live_now' || entry.type === 'milestone' || !!entry.show_sample_tag;
  const labelText = entry.type === 'live_now' ? 'LIVE NOW' : entry.type === 'milestone' ? 'MILESTONE' : '';
  const labelColor = entry.type === 'milestone' ? GOLD : withAlpha(palette.accent, 0.7);

  // Sentence builder
  const anonymous = !!entry.sample && !entry.user.name;
  const userName = entry.user.name || entry.user.username || 'Someone';
  let sentence = '';
  if (anonymous) {
    // sample rows in production never name a person
    const w = entry.workout_name || entry.mood_label;
    sentence = entry.type === 'live_now' ? `${w} session just started` : `${entry.duration_minutes ? `${entry.duration_minutes}-min ` : ''}${w} session finished`;
  } else if (entry.type === 'live_now') {
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
      style={[styles.card, { backgroundColor: cardBg }, !!entry.details?.length && { height: FEED_CARD_HEIGHT + (showLabel ? 30 : 20) }]}
      data-testid={`live-feed-card-${entry.type}-${entry.id}`}
    >
      {/* subtle accent wash to lift card off the black background */}
      <View pointerEvents="none" style={[styles.cardAccentWash, { backgroundColor: semiBg }]} />

      {/* User avatar — small circular pic at the top-right corner so the
          existing copy + LIVE/MILESTONE label below it don't get pushed
          around. Falls back to an initial-letter circle when the user
          hasn't uploaded an avatar. */}
      <View style={styles.cardAvatar} pointerEvents="none">
        {anonymous ? (
          <View style={[styles.cardAvatarImg, styles.cardAvatarFallback, { borderColor: withAlpha(palette.accent, 0.4) }]}>
            <Ionicons name="sparkles" size={13} color={palette.accent} />
          </View>
        ) : entry.user.avatar ? (
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

      {/* Top text column — reserves right padding so the absolutely-positioned
          avatar never overlaps the title/label/sentence. Bottom row keeps its
          full width for the timestamp + Try-this-workout button. */}
      <View style={styles.cardTextColumn}>
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
            {entry.show_sample_tag ? (
              <View style={[styles.sampleTag, { marginLeft: labelText ? 8 : 0 }]}>
                <Text style={styles.sampleTagText}>SAMPLE</Text>
              </View>
            ) : null}
          </View>
        )}

        {entry.type === 'milestone' ? (
          <Text style={styles.milestoneNumber} numberOfLines={1} data-testid={`live-milestone-count-${entry.id}`}>
            {entry.milestone_count} workouts
          </Text>
        ) : (
          <Text style={[styles.moodWord, { color: palette.accent }]} numberOfLines={1} data-testid={`live-mood-${entry.mood_bucket}-${entry.id}`}>
            {entry.mood_label}
          </Text>
        )}

        <Text style={styles.sentence} numberOfLines={1}>{sentence}</Text>
        {entry.details?.length ? (
          <Text style={[styles.details, { color: withAlpha(palette.accent, 0.75) }]} numberOfLines={1} data-testid={`live-feed-details-${entry.id}`}>
            {entry.details.join('  ·  ')}
          </Text>
        ) : null}
      </View>

      <View style={styles.bottomRow}>
        <Text style={[styles.timestamp, { color: withAlpha(palette.accent, 0.5) }]}>
          {entry.ago_text}
        </Text>

        <View style={[styles.tryButton, { borderColor: withAlpha(palette.accent, 0.35) }]}>
          {/* a soft light band sweeps the button every few seconds, staggered down the list */}
          <Shimmer size={130} offset={(index % 8) * 260} pause={2600} duration={1100} strength={0.4} />
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
  const toastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(-12)).current;
  const isFirstLoadRef = useRef(true);
  // Minimum gap between automatic "+N just landed" toasts.
  const toastCooldownUntilRef = useRef(0);

  const showToast = useCallback((message: string) => {
    // V2.1 — clear any in-flight hide timer first. The timeout was previously
    // untracked, so a second toast arriving inside the 2.5s window had its
    // message wiped by the FIRST toast's timer (cutting it short), and a timer
    // firing after unmount set state on a dead component.
    if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
    setToastMessage(message);
    Animated.parallel([
      Animated.timing(toastOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(toastTranslateY, { toValue: 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    // Auto-hide after 2.5s
    toastHideTimerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(toastTranslateY, { toValue: -12, duration: 220, useNativeDriver: true }),
      ]).start(() => setToastMessage(null));
    }, 2500);
  }, [toastOpacity, toastTranslateY]);

  // explore_viewed: once per focus of the Live feed, after its data is on screen. Counts real vs labelled sample
  // sessions so the admin can see how much of Explore is real activity (sample rows are never counted as real).
  const viewPendingRef = useRef(false);
  const latestEntriesRef = useRef<LiveEntry[] | null>(null);
  const fireExploreViewed = useCallback((entries: LiveEntry[], sessionsToday?: number) => {
    viewPendingRef.current = false;
    if (!token) return;
    const sample = entries.filter((e) => e.sample).length;
    trackEvent(token, 'explore_viewed', {
      surface: 'explore',
      real_count: entries.length - sample,
      sample_count: sample,
      v3_count: entries.filter((e) => !e.sample && !!e.v3_preset).length,
      sessions_today: sessionsToday ?? null,
    });
  }, [token]);

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

      // V2.1 — ACCUMULATE the seen set instead of replacing it.
      //
      // This was `new Set(json.entries.map(...))`, i.e. the set was overwritten
      // with only the 30 entries in the current window. Any entry that fell out
      // of the top 30 and later reappeared (feed reorder, a deletion pushing
      // older items back up) was therefore counted as brand new, firing a false
      // "+1 just landed" for something the user had already seen.
      //
      // Bounded so a long session can't grow this without limit: keep the most
      // recent SEEN_CAP ids, which is many windows' worth of history.
      const SEEN_CAP = 600;
      const merged = [...seenIdsRef.current, ...(json.entries || []).map((e) => e.id)];
      seenIdsRef.current = new Set(merged.slice(-SEEN_CAP));
      setData(json);
      latestEntriesRef.current = json.entries || [];
      if (viewPendingRef.current) fireExploreViewed(json.entries || [], json.stats?.sessions_today);

      // Toast logic — skip on the very first load (everything would be "new").
      //
      // V2.1 — added a cooldown. The feed polls every 30s while focused and
      // toasted on ANY new entry, so on an active feed a user sitting on the Live
      // tab got "+N just landed" every 30 seconds indefinitely. A manual
      // pull-to-refresh bypasses the cooldown, because there the user explicitly
      // asked what changed.
      const cooledDown = Date.now() >= toastCooldownUntilRef.current;
      if (!isFirst && newEntries.length > 0 && (isManualRefresh || cooledDown)) {
        toastCooldownUntilRef.current = Date.now() + TOAST_COOLDOWN_MS;
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
  }, [token, showToast, fireExploreViewed]);

  useEffect(() => {
    fetchFeed(false);
  }, [fetchFeed]);

  // Clear the toast hide timer on unmount (leaving the Live tab mid-toast).
  useEffect(() => () => {
    if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
  }, []);

  // Poll every 30s while screen is focused
  useFocusEffect(
    useCallback(() => {
      viewPendingRef.current = true;
      if (latestEntriesRef.current) fireExploreViewed(latestEntriesRef.current);
      const id = setInterval(() => fetchFeed(false), 30000);
      return () => clearInterval(id);
    }, [fetchFeed, fireExploreViewed])
  );

  const handleCardPress = useCallback(
    async (entry: LiveEntry) => {
      // Badge cards are informational — no "Try this workout" hydration.
      if (entry.type === 'badge') return;
      // MOOD V3 workouts and sample sessions: open Build with that kind of session preselected (generator unchanged).
      if (entry.v3_preset) {
        if (token) {
          Analytics.tryWorkoutClicked(token, {
            workout_name: entry.workout_name || entry.mood_label,
            mood_category: entry.mood_label,
            source: entry.sample ? 'live_feed_sample' : 'live_feed_v3',
          });
        }
        router.push({ pathname: '/v3/build', params: buildPresetParams(entry.v3_preset, entry.sample ? 'live_sample' : 'live_v3') } as any);
        return;
      }
      const nav = MOOD_NAV[entry.mood_bucket] || MOOD_NAV.muscle;

      // Phase 7 — if the original completion event carried a snapshot ID,
      // hydrate the viewer's cart with the exact exercises the original
      // athlete ran, then route straight to /cart (mirrors the Explore
      // tab's "Try this workout" replicate behavior). Falls back to the
      // mood sub-selection nav if the snapshot fetch fails for any reason.
      //
      // The snapshot is persisted with workout-session field names
      // (`workoutName`/`workoutTitle`/`moodCategory`), but the cart context
      // expects `WorkoutItem` shape (`name`/`workoutType`/`moodCard`/`id`).
      // We normalize here (mirrors `normalize_snapshot_to_attached_workout`
      // on the server + the cart-item builder in `post-detail.tsx`).
      if (entry.workout_snapshot_id) {
        try {
          const res = await fetch(
            `${API_URL}/api/workout-snapshots/${entry.workout_snapshot_id}`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} },
          );
          if (res.ok) {
            const snap = await res.json();
            const rawItems: any[] = Array.isArray(snap?.workouts) ? snap.workouts : [];
            const moodCategory: string =
              snap?.mood_category ||
              rawItems[0]?.moodCategory ||
              rawItems[0]?.workoutType ||
              nav.title;
            const snapshotId: string = String(snap?.id || entry.workout_snapshot_id);

            const cartItems = rawItems
              .map((w, idx) => {
                const name = w.name || w.workoutName || w.workoutTitle;
                if (!name) return null;
                return {
                  id: w.id || `live-snapshot-${snapshotId}-${idx}`,
                  name,
                  duration: String(w.duration || '10 min'),
                  description: w.description || w.battlePlan || '',
                  battlePlan: w.battlePlan || '',
                  imageUrl: w.imageUrl || '',
                  intensityReason: w.intensityReason || '',
                  equipment: w.equipment || 'Bodyweight',
                  difficulty: w.difficulty || 'intermediate',
                  workoutType: w.workoutType || w.moodCategory || moodCategory,
                  moodCard: w.moodCard || w.moodCategory || moodCategory,
                  moodTips: Array.isArray(w.moodTips) ? w.moodTips : [],
                  source: 'build_for_me' as const,
                };
              })
              .filter((x): x is NonNullable<typeof x> => x !== null);

            if (cartItems.length > 0) {
              clearCart();
              cartItems.forEach((w) => addToCart(w));
              if (token) {
                Analytics.tryWorkoutClicked(token, {
                  workout_name: entry.workout_name || entry.mood_label,
                  mood_category: nav.title,
                  source: 'live_feed_snapshot',
                  // Credits the original athlete with the "inspiring others" badge.
                  workout_snapshot_id: entry.workout_snapshot_id || undefined,
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
        <Intro />
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
        <Intro />
        <StatHeader sessions={stats.sessions_today} mood={stats.most_common_mood} />
        {entries.some((e) => e.show_sample_tag) ? (
          <Text style={styles.sampleNote}>Includes sample sessions while MOOD’s live community grows.</Text>
        ) : null}
        <View style={{ paddingHorizontal: 16 }}>
          {entries.map((entry, i) => (
            <FeedCard key={entry.id} entry={entry} index={i} onPress={handleCardPress} />
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
  sampleTag: { paddingHorizontal: 5, height: 15, borderRadius: 4, justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.28)' },
  sampleTagText: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.8, color: 'rgba(255,255,255,0.62)' },
  sampleNote: { fontSize: 11.5, color: 'rgba(255,255,255,0.42)', paddingHorizontal: 16, marginTop: -4, marginBottom: 10, lineHeight: 16 },
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
    height: FEED_CARD_HEIGHT,
    justifyContent: 'center',
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
    paddingVertical: 12,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
    height: FEED_CARD_HEIGHT,
    justifyContent: 'space-between',
  },
  cardAccentWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Badge unlock card
  badgeCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  badgeAgo: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  badgeTextCol: {
    flex: 1,
    minWidth: 0,
  },
  badgeEyebrow: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    marginBottom: 1,
  },
  badgeLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  // Top text column reserves space for the absolutely-positioned 44px avatar
  // (right:14 + width:44 + 10px breathing room = ~68px). Bottom row stays full
  // width so the Try-this-workout button sits flush right.
  cardTextColumn: {
    paddingRight: 68,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
  },
  moodWord: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 2,
  },
  milestoneNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    lineHeight: 22,
    marginBottom: 0,
    letterSpacing: -0.5,
  },
  sentence: {
    color: '#C9C9C9',
    fontSize: 13,
    lineHeight: 17,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 11,
  },
  details: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 3,
  },
  intro: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  introHeadline: {
    color: TEXT_PRIMARY,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  introSub: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  tryButton: {
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
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
