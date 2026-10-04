/**
 * Profile (V3, Oct 2026): what have I done + how am I progressing. The social profile (posts, followers, DMs) is gone.
 *
 *   HEADER          avatar (Edit Profile) · name · "47 workouts · 31h training" · settings
 *   STATS           Workouts · Training · Week streak · Achievements
 *   ACTIVITY        month calendar of trained days + this week's summary
 *   ACHIEVEMENTS    five simple milestones, earned and locked (no XP / levels)
 *   YOUR MOOD       personal patterns, only when the user's own history supports them
 *   WORKOUT HISTORY V3 workouts by day -> the V3 Cart in completed mode (read-only, Do Again)
 *   GOAL BIO        "MOOD is here to help you <funnel goal>." + how MOOD helps on their typical State / with their barrier (goalBio)
 *   SAVED           a row into the Saved page (app/saved.tsx)
 *   HISTORY ROWS    View Workout (Cart, completed mode) · Stats (the completion share overlay) · Do Again
 *
 * One request (GET /api/v3/me/activity); every number is derived in utils/v3Activity.ts (tested). Nothing is estimated.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { FounderMessageCard } from '../../components/FounderMessage';
import { useFounderMessage } from '../../utils/founderMessage';
import GuestPromptModal from '../../components/GuestPromptModal';
import { FoundingMemberBadge } from '../../components/FoundingMemberBadge';
import AchievementMedallion from '../../components/AchievementMedallion';
import { API_URL } from '../../utils/apiConfig';
import { readCache, writeCache } from '../../utils/dataCache';
import { trackEvent } from '../../utils/analytics';
import { fetchSaved } from '../../utils/v3Saved';
import { fetchTrainingProfile } from '../../utils/v3Profile';
import { CompletedStatsOverlay } from '../../components/v3/CompletedStatsOverlay';
import { getMyActivity } from '../../utils/v3ExploreApi';
import { DIRECTION_ACCENT, buildPresetParams } from '../../utils/v3Explore';
import {
  ActivityRow,
  HistoryItem,
  achievements,
  dayLabel,
  doAgainPreset,
  formatMinutes,
  historyCount,
  historyGroups,
  insights,
  monthGrid,
  goalBio,
  profileStats,
  thisWeek,
  weekLine,
} from '../../utils/v3Activity';
import { resolveV3CartHero } from '../../utils/cartHero';
import { heroImageSource } from '../../components/v3/v3Images';

const GUTTER = 16;
const HISTORY_PAGE = 8;
const TRAINED = '#FF9A3D'; // Home week strip's trained-day colour

function avatarUri(a?: string | null): string | null {
  if (!a) return null;
  if (a.startsWith('http')) return a;
  return a.startsWith('/') ? `${API_URL}${a}` : `${API_URL}/api/uploads/${a}`;
}

/* ------------------------------------------------------------------ pieces */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.secHead}>
      <View style={{ flex: 1 }}>
        <Text style={styles.secTitle}>{title}</Text>
        {sub ? <Text style={styles.secSub}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function HistoryRow({ h, last, onView, onStats, onAgain }: { h: HistoryItem; last: boolean; onView: () => void; onStats: () => void; onAgain: () => void }) {
  const hero = useMemo(
    () => resolveV3CartHero({ workout_id: h.workoutId, created_at: h.row.created_at ?? undefined, direction: h.row.direction!, archetype: { id: h.row.archetype?.id ?? '' }, target: h.row.target ?? null } as any),
    [h],
  );
  return (
    <Pressable onPress={onView} style={({ pressed }) => [styles.histRow, !last && styles.divider, pressed && { opacity: 0.85 }]} testID={`profile-history-${h.workoutId}`}>
      <Image source={heroImageSource(hero.source, 64) as any} style={styles.histThumb} contentFit="cover" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.histTitle} numberOfLines={1}>
          {h.title}
        </Text>
        <Text style={styles.histMeta} numberOfLines={1}>
          {h.meta}
        </Text>
        {h.facts ? <Text style={styles.histFacts}>{h.facts}</Text> : null}
        <View style={styles.histActions}>
          <Text style={styles.histView}>View Workout →</Text>
          <View style={styles.histRight}>
            <Pressable onPress={onStats} hitSlop={8} testID={`profile-stats-${h.workoutId}`}>
              <Text style={styles.histAgain}>Stats</Text>
            </Pressable>
            <Pressable onPress={onAgain} hitSlop={8} testID={`profile-do-again-${h.workoutId}`}>
              <Text style={styles.histAgain}>Do Again</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ screen */

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user, isGuest } = useAuth();
  const uid = user?.id ?? null;
  const founder = useFounderMessage(isGuest ? null : uid);

  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [goal, setGoal] = useState<string | null | undefined>(undefined);
  const [barrier, setBarrier] = useState<string | null>(null);
  const [statsFor, setStatsFor] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [guestModal, setGuestModal] = useState(false);
  const [historyShown, setHistoryShown] = useState(HISTORY_PAGE);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const lastFetch = useRef(0);
  const viewed = useRef(false);

  const track = useCallback((name: string, meta: Record<string, any> = {}) => {
    if (token) trackEvent(token, name, { surface: 'profile', ...meta });
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    lastFetch.current = Date.now();
    const [a, s] = await Promise.all([
      getMyActivity(token),
      fetchSaved(token),
      fetchTrainingProfile(token)
        .then((p) => {
          setBarrier((p?.profile?.biggest_barrier as string | undefined) ?? null);
          setGoal((p?.profile?.goal as string | undefined) ?? null);
        })
        .catch(() => setGoal(null)),
    ]);
    if (a) {
      setRows(a);
      setFailed(false);
      if (uid) writeCache(`profile:activity:${uid}`, a);
    } else setFailed(true);
    if (s) setSavedCount(s.length);
  }, [token, uid]);

  // last-known activity paints instantly; the server copy replaces it
  useEffect(() => {
    if (!uid) return;
    let alive = true;
    readCache<ActivityRow[]>(`profile:activity:${uid}`).then((c) => {
      if (alive && c) setRows((cur) => cur ?? c);
    });
    return () => {
      alive = false;
    };
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      if (Date.now() - lastFetch.current > 5000) load();
    }, [load]),
  );

  const now = new Date();
  const data = rows ?? [];
  const stats = useMemo(() => profileStats(data, now), [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const week = useMemo(() => thisWeek(data, now), [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const grid = useMemo(() => monthGrid(month.y, month.m, data, now), [rows, month]); // eslint-disable-line react-hooks/exhaustive-deps
  const badges = useMemo(() => achievements(data), [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const mine = useMemo(() => insights(data), [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const groups = useMemo(() => historyGroups(data, now, historyShown), [rows, historyShown]); // eslint-disable-line react-hooks/exhaustive-deps
  const totalHistory = useMemo(() => historyCount(data), [rows]);
  const earned = badges.filter((b) => b.earned).length;

  useEffect(() => {
    if (!rows || viewed.current) return;
    viewed.current = true;
    track('profile_viewed', { workouts: stats.workouts, v3_history: totalHistory, insights: mine.length, achievements: earned });
  }, [rows, stats.workouts, totalHistory, mine.length, earned, track]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const shiftMonth = (delta: number) => {
    Haptics.selectionAsync().catch(() => undefined);
    setMonth(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };
  const atCurrentMonth = month.y === now.getFullYear() && month.m === now.getMonth();

  const viewWorkout = (h: HistoryItem) => {
    const d = new Date(h.row.at);
    const when = dayLabel(d, now);
    const label = ['Completed ' + (when === 'TODAY' ? 'today' : when === 'YESTERDAY' ? 'yesterday' : when.charAt(0) + when.slice(1).toLowerCase()), h.facts || null].filter(Boolean).join(' · ');
    track('profile_history_opened', { workout_id: h.workoutId });
    router.push({ pathname: '/v3/workout', params: { id: h.workoutId, completed: label } } as any);
  };

  const doAgain = (h: HistoryItem) => {
    const p = doAgainPreset(h.row);
    if (!p) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    track('v3_do_again_tapped', { workout_id: h.workoutId, surface: 'profile_history' });
    router.push({ pathname: '/v3/build', params: buildPresetParams(p, 'do_again') } as any);
  };

  /* ---------------------------------------------------------------- guest */
  if (isGuest) {
    return (
      <View style={[styles.root, styles.center, { paddingHorizontal: 32 }]}>
        <Ionicons name="person-circle-outline" size={56} color="rgba(255,255,255,0.5)" />
        <Text style={[styles.secTitle, { marginTop: 12, textAlign: 'center' }]}>Your training lives here</Text>
        <Text style={[styles.secSub, { textAlign: 'center', marginTop: 6 }]}>Create an account to track your workouts, streaks and achievements.</Text>
        <Pressable onPress={() => setGuestModal(true)} style={{ marginTop: 18 }}>
          <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn as any}>
            <Text style={styles.primaryBtnText}>Get started</Text>
          </LinearGradient>
        </Pressable>
        <GuestPromptModal visible={guestModal} onClose={() => setGuestModal(false)} action="track your training" />
      </View>
    );
  }

  const name = user?.name || user?.username || 'You';
  const avatar = avatarUri(user?.avatar);
  // Admin Dashboard entry: the officialmoodapp account, or anyone the server's ADMIN_ALLOWLIST marks admin (/api/auth/me
  // is_admin_effective). The dashboard re-checks on the server either way.
  const isAdmin = user?.username?.toLowerCase() === 'officialmoodapp' || (user as any)?.is_admin_effective === true;
  const hasAny = data.length > 0;
  const trainingValue = formatMinutes(stats.minutes, { hoursOnly: stats.minutes >= 600 });
  const line = goalBio(goal, barrier, data);

  return (
    <View style={styles.root} testID="profile-v3">
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} colors={[COLORS.accent]} />}
      >
        {/* ---------------- header */}
        <View style={[styles.pad, styles.topBar]}>
          <View style={{ flex: 1 }} />
          {isAdmin ? (
            <Pressable onPress={() => router.push('/admin-dashboard' as any)} hitSlop={10} style={styles.adminPill} accessibilityLabel="Admin dashboard" testID="profile-admin">
              <Ionicons name="analytics" size={15} color={COLORS.accent} />
              <Text style={styles.adminPillText}>Admin</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => router.push('/settings' as any)} hitSlop={10} style={styles.iconBtn} accessibilityLabel="Settings" testID="profile-settings">
            <Ionicons name="settings-outline" size={21} color={COLORS.textPrimary} />
          </Pressable>
        </View>

        <View style={[styles.pad, styles.identity]}>
          <Pressable onPress={() => router.push('/edit-profile' as any)} accessibilityLabel="Edit profile" testID="profile-avatar">
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{name[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.editDot}>
              <Ionicons name="pencil" size={11} color={COLORS.accentInk} />
            </View>
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              {user?.founding_member ? <FoundingMemberBadge size="sm" /> : null}
            </View>
            <Text style={styles.nameSub}>
              {rows ? `${stats.workouts} workout${stats.workouts === 1 ? '' : 's'}${stats.minutes ? ` · ${trainingValue} training` : ''}` : ' '}
            </Text>
          </View>
        </View>

        {goal !== undefined ? (
          <Text style={[styles.pad, styles.goal]} testID="profile-goal-line">
            {line.lead}
            <Text style={styles.goalStrong}>{line.goal}</Text>
            {` ${line.rest}`}
          </Text>
        ) : null}

        {/* ---------------- stats */}
        <View style={[styles.pad, { marginTop: 18 }]}>
          <View style={[styles.card, styles.statsRow]}>
            <Stat value={rows ? String(stats.workouts) : '–'} label="Workouts" />
            <View style={styles.statSep} />
            <Stat value={rows ? trainingValue : '–'} label="Training" />
            <View style={styles.statSep} />
            <Stat value={rows ? String(stats.weekStreak) : '–'} label="Week streak" />
            <View style={styles.statSep} />
            <Stat value={rows ? String(earned) : '–'} label="Achievements" />
          </View>
          <Pressable onPress={() => router.push('/saved' as any)} style={({ pressed }) => [styles.card, styles.savedEntry, pressed && { opacity: 0.85 }]} testID="profile-saved">
            <View style={styles.savedIcon}>
              <Ionicons name="bookmark" size={16} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.savedTitle}>Saved</Text>
              <Text style={styles.savedMeta}>{savedCount == null ? 'Your saved workouts' : savedCount ? `${savedCount} workout${savedCount === 1 ? '' : 's'}` : 'Bookmark a workout to keep it here'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color="rgba(255,255,255,0.4)" />
          </Pressable>
          {founder.message ? (
            <FounderMessageCard message={founder.message} unseen={founder.unseen} uid={uid} onOpened={() => track('founder_message_opened', { first: founder.unseen })} />
          ) : null}
        </View>

        {!rows && !failed ? (
          <View style={{ paddingTop: 40 }}>
            <ActivityIndicator color={COLORS.accent} />
          </View>
        ) : null}
        {failed && !rows ? (
          <Pressable onPress={load} style={[styles.pad, { paddingTop: 30, alignItems: 'center' }]}>
            <Text style={styles.secSub}>Couldn’t load your training. Tap to try again.</Text>
          </Pressable>
        ) : null}

        {rows && !hasAny ? (
          <View style={[styles.pad, { marginTop: 22 }]}>
            <View style={[styles.card, { padding: 20, alignItems: 'flex-start' }]}>
              <Ionicons name="sparkles" size={18} color={COLORS.accent} />
              <Text style={[styles.secTitle, { marginTop: 10 }]}>Your training story starts here</Text>
              <Text style={[styles.secSub, { marginTop: 4, lineHeight: 18 }]}>Finish your first MOOD workout and your history, streaks and achievements show up on this page.</Text>
              <Pressable onPress={() => router.push('/v3/build' as any)} style={{ marginTop: 16 }} testID="profile-first-workout">
                <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn as any}>
                  <Text style={styles.primaryBtnText}>Build a workout</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        ) : null}

        {rows && hasAny ? (
          <>
            {/* ---------------- activity */}
            <View style={[styles.pad, { marginTop: 28 }]}>
              <SectionHead title="Activity" />
              <View style={[styles.card, { marginTop: 12, padding: 16 }]}>
                <View style={styles.monthBar}>
                  <Pressable onPress={() => shiftMonth(-1)} hitSlop={10} accessibilityLabel="Previous month">
                    <Ionicons name="chevron-back" size={18} color={COLORS.textSecondary} />
                  </Pressable>
                  <Text style={styles.monthLabel}>{grid.label}</Text>
                  <Pressable onPress={() => !atCurrentMonth && shiftMonth(1)} hitSlop={10} disabled={atCurrentMonth} accessibilityLabel="Next month">
                    <Ionicons name="chevron-forward" size={18} color={atCurrentMonth ? 'rgba(255,255,255,0.18)' : COLORS.textSecondary} />
                  </Pressable>
                </View>
                <View style={styles.calRow}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => (
                    <Text key={i} style={styles.calLetter}>
                      {l}
                    </Text>
                  ))}
                </View>
                {grid.weeks.map((w, wi) => (
                  <View key={wi} style={styles.calRow}>
                    {w.map((c) => (
                      <View key={c.key} style={styles.calCell}>
                        <View style={[styles.calDay, c.trained && c.inMonth && styles.calTrained, c.isToday && styles.calToday]}>
                          <Text
                            style={[
                              styles.calNum,
                              !c.inMonth && { color: 'rgba(255,255,255,0.15)' },
                              c.inMonth && c.isFuture && { color: 'rgba(255,255,255,0.3)' },
                              c.trained && c.inMonth && styles.calNumTrained,
                            ]}
                          >
                            {c.day}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
                <Text style={styles.calFoot}>
                  {grid.trainedCount} training day{grid.trainedCount === 1 ? '' : 's'} in {grid.label.split(' ')[0]}
                </Text>
                <View style={styles.weekBox}>
                  <Text style={styles.weekEyebrow}>THIS WEEK</Text>
                  <Text style={styles.weekLine}>{weekLine(week)}</Text>
                  {week.byDirection.length ? (
                    <View style={styles.weekDirs}>
                      {week.byDirection.map((d) => (
                        <View key={d.direction} style={styles.weekDir}>
                          <View style={[styles.weekDot, { backgroundColor: DIRECTION_ACCENT[d.direction] }]} />
                          <Text style={styles.weekDirText}>
                            {d.name} {d.count}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* ---------------- achievements */}
            <View style={{ marginTop: 28 }}>
              <View style={styles.pad}>
                <SectionHead title="Achievements" sub={`${earned} of ${badges.length} earned`} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 10, paddingTop: 12 }}>
                {badges.map((b) => (
                  <View key={b.id} style={[styles.card, styles.badge]} testID={`profile-achievement-${b.id}`}>
                    <AchievementMedallion icon={b.icon as any} size={52} locked={!b.earned} progress={b.earned ? null : b.progress / b.goal} value={b.goal > 1 && b.id !== 'all_around' ? String(b.goal) : null} glow={false} />
                    <Text style={[styles.badgeTitle, !b.earned && { color: COLORS.textSecondary }]} numberOfLines={1}>
                      {b.title}
                    </Text>
                    <Text style={styles.badgeDesc} numberOfLines={2}>
                      {b.description}
                    </Text>
                    {b.earned ? (
                      <Text style={styles.badgeEarned}>Earned</Text>
                    ) : (
                      <View style={styles.badgeTrack}>
                        <View style={[styles.badgeFill, { width: `${Math.round((b.progress / b.goal) * 100)}%` }]} />
                      </View>
                    )}
                    {!b.earned ? (
                      <Text style={styles.badgeProgress}>
                        {b.progress} / {b.goal}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* ---------------- your MOOD */}
            {mine.length ? (
              <View style={[styles.pad, { marginTop: 28 }]}>
                <SectionHead title="Your MOOD" sub="What your training says about you" />
                <View style={styles.insGrid}>
                  {mine.map((i) => (
                    <View key={i.key} style={[styles.card, styles.insCell]}>
                      <Text style={styles.insLabel}>{i.label.toUpperCase()}</Text>
                      <Text style={styles.insValue} numberOfLines={1} adjustsFontSizeToFit>
                        {i.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* ---------------- history */}
            <View style={[styles.pad, { marginTop: 28 }]}>
              <SectionHead title="Workout History" sub={totalHistory ? `${totalHistory} MOOD workout${totalHistory === 1 ? '' : 's'}` : undefined} />
              {groups.length ? (
                groups.map((g) => (
                  <View key={g.key} style={{ marginTop: 16 }}>
                    <Text style={styles.histDay}>{g.label}</Text>
                    <View style={[styles.card, { marginTop: 8 }]}>
                      {g.items.map((h, i) => (
                        <HistoryRow
                          key={h.workoutId}
                          h={h}
                          last={i === g.items.length - 1}
                          onView={() => viewWorkout(h)}
                          onStats={() => {
                            track('v3_completed_stats_opened', { workout_id: h.workoutId, surface: 'profile_history' });
                            setStatsFor(h.workoutId);
                          }}
                          onAgain={() => doAgain(h)}
                        />
                      ))}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[styles.secSub, { marginTop: 10 }]}>Workouts you finish with MOOD’s guided session will appear here.</Text>
              )}
              {totalHistory > historyShown ? (
                <Pressable onPress={() => setHistoryShown((n) => n + HISTORY_PAGE * 2)} style={({ pressed }) => [styles.moreBtn, pressed && { opacity: 0.7 }]}>
                  <Text style={styles.moreText}>Show more</Text>
                </Pressable>
              ) : null}
            </View>
          </>
        ) : null}

      </ScrollView>
      <CompletedStatsOverlay visible={!!statsFor} token={token ?? null} workoutId={statsFor} onClose={() => setStatsFor(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: GUTTER },
  card: { borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40 },
  adminPill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 13, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)' },
  adminPillText: { fontSize: 13.5, fontWeight: '700', color: COLORS.textPrimary },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6 },
  avatar: { width: 76, height: 76, borderRadius: 38 },
  avatarFallback: { backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 30, fontWeight: '800', color: COLORS.textPrimary },
  editDot: { position: 'absolute', right: 0, bottom: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.bg },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.8 },
  nameSub: { fontSize: 14, fontWeight: '600', color: '#8D8D90', marginTop: 3 },

  statsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11.5, fontWeight: '600', color: '#8D8D90', marginTop: 3 },
  statSep: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: 'rgba(255,255,255,0.12)' },

  secHead: { flexDirection: 'row', alignItems: 'flex-end' },
  secTitle: { fontSize: 19, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.4 },
  secSub: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },

  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  monthLabel: { fontSize: 14.5, fontWeight: '700', color: COLORS.textPrimary },
  calRow: { flexDirection: 'row' },
  calLetter: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', marginBottom: 6 },
  calCell: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  calDay: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  calTrained: { backgroundColor: TRAINED },
  calToday: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.75)' },
  calNum: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)', fontVariant: ['tabular-nums'] },
  calNumTrained: { color: '#140A00', fontWeight: '800' },
  calFoot: { fontSize: 12, color: '#8D8D90', marginTop: 8, fontWeight: '500' },
  weekBox: { marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  weekEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: COLORS.textSecondary },
  weekLine: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 4 },
  weekDirs: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 8 },
  weekDir: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weekDot: { width: 7, height: 7, borderRadius: 4 },
  weekDirText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },

  badge: { width: 132, padding: 14, alignItems: 'flex-start' },
  badgeTitle: { fontSize: 13.5, fontWeight: '800', color: COLORS.textPrimary, marginTop: 10 },
  badgeDesc: { fontSize: 11.5, color: '#8D8D90', marginTop: 2, lineHeight: 15, minHeight: 30 },
  badgeEarned: { fontSize: 11.5, fontWeight: '800', color: '#5FE0A0', marginTop: 8 },
  badgeTrack: { alignSelf: 'stretch', height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 10, overflow: 'hidden' },
  badgeFill: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.55)' },
  badgeProgress: { fontSize: 11, fontWeight: '600', color: '#8D8D90', marginTop: 5, fontVariant: ['tabular-nums'] },

  insGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  insCell: { width: '48.4%', padding: 14 },
  insLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, color: '#8D8D90' },
  insValue: { fontSize: 19, fontWeight: '800', color: COLORS.textPrimary, marginTop: 6, letterSpacing: -0.3 },

  histDay: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1.6, color: COLORS.textSecondary },
  histRow: { flexDirection: 'row', gap: 12, padding: 12 },
  histThumb: { width: 64, height: 80, borderRadius: 12, backgroundColor: COLORS.surface },
  histTitle: { fontSize: 15.5, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.2 },
  histMeta: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginTop: 2 },
  histFacts: { fontSize: 12.5, fontWeight: '500', color: '#8D8D90', marginTop: 2 },
  histActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  histView: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  histAgain: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  moreBtn: { alignSelf: 'center', marginTop: 14, paddingHorizontal: 18, height: 36, borderRadius: 18, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  moreText: { fontSize: 13.5, fontWeight: '700', color: COLORS.textPrimary },

  savedEntry: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, marginTop: 10 },
  savedIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' },
  goal: { fontSize: 15, lineHeight: 21, color: '#8D8D90', marginTop: 14, fontWeight: '500' },
  goalStrong: { color: COLORS.textPrimary, fontWeight: '700' },
  histRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  savedTitle: { fontSize: 14.5, fontWeight: '700', color: COLORS.textPrimary },
  savedMeta: { fontSize: 12.5, color: '#8D8D90', marginTop: 2 },

  primaryBtn: { height: 42, paddingHorizontal: 20, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.accentInk },
});
