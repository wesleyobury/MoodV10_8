/**
 * MOOD — Achievement badges (v2 gamification).
 *
 * NOTE ON NAMING: the app already has a `BadgeContext`/`useBadges` for
 * notification + message COUNTS (the red dots on tabs). To avoid a collision,
 * this gamification system is namespaced "achievements" in code even though the
 * user-facing copy calls them "badges".
 *
 * All badge evaluation is a pure function of `AchievementSignals`, which the
 * client fetches from `GET /api/achievements/state` (single source of truth).
 * Client-detected badges fire a `badge_earned` analytics event when celebrated;
 * server-authoritative badges (e.g. inspiring_others) are emitted by the server.
 *
 * DESIGN GUARDRAILS (see constants/brand.ts + memory/DESIGN_GUARDRAILS.md):
 *  - Gold is ALWAYS the gold→orange gradient with depth, never flat mustard.
 *  - Never gold-on-gold: emblems use dark ink on the gold gradient.
 */

export type AchievementCategory =
  | 'streak'
  | 'consistency'
  | 'volume'
  | 'difficulty'
  | 'mood'
  | 'social';

/** Ionicons glyph name (app standard icon set). */
export type IoniconName =
  | 'flame'
  | 'calendar'
  | 'barbell'
  | 'flash'
  | 'happy'
  | 'chatbubble-ellipses'
  | 'people'
  | 'trophy';

export interface AchievementSignals {
  total_workouts: number;
  active_streak: number;
  workout_streak: number;
  workout_streak_best: number;
  workout_days_last_7: number;
  workout_days_last_14: number;
  moods_tried: number;
  difficulties_tried: number;
  hard_workouts: number;
  posts_count: number;
  server_badges: string[];
}

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  /** Short title shown on the medallion / grid. */
  label: string;
  /** One-line celebratory copy for the toast. */
  description: string;
  icon: IoniconName;
  /** Pure predicate over the signals. */
  isEarned: (s: AchievementSignals) => boolean;
  /** Higher = celebrated first when several unlock at once. */
  priority?: number;
}

export const EMPTY_SIGNALS: AchievementSignals = {
  total_workouts: 0,
  active_streak: 0,
  workout_streak: 0,
  workout_streak_best: 0,
  workout_days_last_7: 0,
  workout_days_last_14: 0,
  moods_tried: 0,
  difficulties_tried: 0,
  hard_workouts: 0,
  posts_count: 0,
  server_badges: [],
};

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Streaks (in a row) — keyed off the WORKOUT-completion streak ──
  { id: 'streak_3', category: 'streak', label: '3-day streak', description: 'Three days in a row. The habit is starting.', icon: 'flame', isEarned: s => s.workout_streak >= 3 },
  { id: 'streak_5', category: 'streak', label: '5-day streak', description: 'Five in a row — that’s a habit forming.', icon: 'flame', isEarned: s => s.workout_streak >= 5 },
  { id: 'streak_7', category: 'streak', label: '7-day streak', description: 'A full week of training. Serious momentum.', icon: 'flame', isEarned: s => s.workout_streak >= 7 },
  { id: 'streak_14', category: 'streak', label: '14-day streak', description: 'Two weeks straight. This is who you are now.', icon: 'flame', isEarned: s => s.workout_streak >= 14 },
  { id: 'streak_30', category: 'streak', label: '30-day streak', description: 'Thirty days. Exceptional consistency.', icon: 'flame', isEarned: s => s.workout_streak >= 30 },

  // ── Consistency (every-other-day counts) ──
  { id: 'consistent_5of7', category: 'consistency', label: '5 of 7 days', description: 'Five workouts in a week. Consistent.', icon: 'calendar', isEarned: s => s.workout_days_last_7 >= 5 },
  { id: 'consistent_7of14', category: 'consistency', label: '7 of 14 days', description: 'Trained every other day for two weeks.', icon: 'calendar', isEarned: s => s.workout_days_last_14 >= 7 },

  // ── Volume (total workouts) ──
  { id: 'vol_1', category: 'volume', label: 'First workout', description: 'Your first one is in the books. Welcome.', icon: 'barbell', priority: 5, isEarned: s => s.total_workouts >= 1 },
  { id: 'vol_10', category: 'volume', label: '10 workouts', description: 'Double digits. You show up.', icon: 'barbell', isEarned: s => s.total_workouts >= 10 },
  { id: 'vol_25', category: 'volume', label: '25 workouts', description: 'Twenty-five sessions strong.', icon: 'barbell', isEarned: s => s.total_workouts >= 25 },
  { id: 'vol_50', category: 'volume', label: '50 workouts', description: 'Fifty workouts. Real commitment.', icon: 'trophy', isEarned: s => s.total_workouts >= 50 },
  { id: 'vol_100', category: 'volume', label: '100 workouts', description: 'A century of sessions. Elite.', icon: 'trophy', isEarned: s => s.total_workouts >= 100 },

  // ── Difficulty ──
  { id: 'diff_first_hard', category: 'difficulty', label: 'First Hard', description: 'You went for the hard one. Respect.', icon: 'flash', isEarned: s => s.hard_workouts >= 1 },
  { id: 'diff_hard_10', category: 'difficulty', label: '10 Hard', description: 'Ten hard workouts. You seek the burn.', icon: 'flash', isEarned: s => s.hard_workouts >= 10 },
  { id: 'diff_all_levels', category: 'difficulty', label: 'Every level', description: 'You’ve trained at every difficulty.', icon: 'flash', isEarned: s => s.difficulties_tried >= 3 },

  // ── Mood ──
  { id: 'mood_first', category: 'mood', label: 'First mood', description: 'You matched a workout to your mood.', icon: 'happy', isEarned: s => s.moods_tried >= 1 },
  { id: 'mood_all', category: 'mood', label: 'All moods', description: 'You’ve trained every mood. Range.', icon: 'happy', isEarned: s => s.moods_tried >= 6 },
  { id: 'mood_10', category: 'mood', label: '10 mood logs', description: 'Ten mood-matched sessions.', icon: 'happy', isEarned: s => s.total_workouts >= 10 && s.moods_tried >= 1 },

  // ── Social ──
  { id: 'first_post', category: 'social', label: 'First post', description: 'You shared to the feed. Nice.', icon: 'chatbubble-ellipses', isEarned: s => s.posts_count >= 1 },
  { id: 'inspiring_others', category: 'social', label: 'Inspiring others', description: 'Someone copied your workout. Keep leading the way.', icon: 'people', priority: 10, isEarned: s => s.server_badges.includes('inspiring_others') },
];

export const ACHIEVEMENTS_BY_ID: Record<string, AchievementDef> = ACHIEVEMENTS.reduce(
  (acc, a) => {
    acc[a.id] = a;
    return acc;
  },
  {} as Record<string, AchievementDef>,
);

export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length;

/** Ordered list of ids the signals currently satisfy. */
export function evaluateEarned(signals: AchievementSignals): string[] {
  return ACHIEVEMENTS.filter(a => a.isEarned(signals)).map(a => a.id);
}
