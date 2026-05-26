import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import BackButton from '../components/BackButton';
import Constants from 'expo-constants';

import { API_URL } from '../utils/apiConfig';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ActivityStats {
  total_workouts: number;
  total_posts: number;
  total_comments: number;
  total_likes: number;
  current_streak: number;
}

interface WorkoutStats {
  total_workouts_completed: number;
  completion_rate: number;
  workouts_by_mood: { [key: string]: number };
  workouts_by_difficulty: { [key: string]: number };
  average_workouts_per_week: number;
}

interface SocialStats {
  posts_created: number;
  likes_given: number;
  comments_made: number;
  follows: number;
  current_followers: number;
  current_following: number;
  engagement_score: number;
}

export default function UserStatsScreen() {
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null);
  const [userStreak, setUserStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();

  const fetchStats = async () => {
    if (!token) return;

    try {
      const [activity, workout, social, userProfile] = await Promise.all([
        fetch(`${API_URL}/api/analytics/activity-summary?days=${selectedPeriod}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(`${API_URL}/api/analytics/workout-stats?days=${selectedPeriod}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(`${API_URL}/api/analytics/social-stats?days=${selectedPeriod}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        // Fetch user profile to get accurate streak (same source as profile tab)
        fetch(`${API_URL}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json())
      ]);

      setActivityStats(activity);
      setWorkoutStats(workout);
      setSocialStats(social);
      // Use streak from user profile for consistency
      setUserStreak(userProfile?.current_streak || activity?.current_streak || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedPeriod]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  // Get primary training focus
  const getTrainingFocus = () => {
    if (!workoutStats?.workouts_by_mood || Object.keys(workoutStats.workouts_by_mood).length === 0) {
      return null;
    }
    const sorted = Object.entries(workoutStats.workouts_by_mood).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    return {
      name: sorted[0][0],
      count: sorted[0][1],
      percentage: Math.round((sorted[0][1] / (workoutStats?.total_workouts_completed || 1)) * 100)
    };
  };

  // Get dominant difficulty
  const getDominantDifficulty = () => {
    if (!workoutStats?.workouts_by_difficulty || Object.keys(workoutStats.workouts_by_difficulty).length === 0) {
      return null;
    }
    const sorted = Object.entries(workoutStats.workouts_by_difficulty).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    const total = Object.values(workoutStats.workouts_by_difficulty).reduce((a, b) => a + b, 0);
    return {
      name: sorted[0][0],
      percentage: Math.round((sorted[0][1] / total) * 100)
    };
  };

  // Format streak delta text
  const getStreakDelta = () => {
    if (userStreak === 0) return 'Start your streak today';
    if (userStreak === 1) return 'Keep the momentum going';
    if (userStreak < 7) return `${7 - userStreak} days to your first week`;
    if (userStreak < 30) return `${30 - userStreak} days to a month`;
    return 'Exceptional consistency';
  };

  const trainingFocus = getTrainingFocus();
  const dominantDifficulty = getDominantDifficulty();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Minimal Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Your Stats</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
        }
      >
        {/* Period Selector - Subtle */}
        <View style={styles.periodSelector}>
          {[7, 30, 90].map(days => (
            <TouchableOpacity
              key={days}
              style={[styles.periodButton, selectedPeriod === days && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod(days)}
            >
              <Text style={[styles.periodText, selectedPeriod === days && styles.periodTextActive]}>
                {days}D
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hero Section - Streak */}
        <View style={styles.heroSection}>
          <Text style={styles.heroLabel}>CONSISTENCY</Text>
          <View style={styles.heroValueRow}>
            <Text style={styles.heroValue}>{userStreak}</Text>
            <Text style={styles.heroUnit}>day active streak</Text>
          </View>
          <Text style={styles.heroDelta}>{getStreakDelta()}</Text>
        </View>

        {/* Training Volume Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {workoutStats?.total_workouts_completed || 0}
            </Text>
            <Text style={styles.metricLabel}>Workouts</Text>
          </View>
          
          <View style={styles.metricDivider} />
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {workoutStats?.average_workouts_per_week?.toFixed(1) || '0.0'}
            </Text>
            <Text style={styles.metricLabel}>Avg / Week</Text>
          </View>
          
          <View style={styles.metricDivider} />
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {workoutStats?.completion_rate?.toFixed(0) || 0}%
            </Text>
            <Text style={styles.metricLabel}>Completion</Text>
          </View>
        </View>

        {/* Training Identity */}
        {trainingFocus && (
          <View style={styles.insightSection}>
            <Text style={styles.insightLabel}>TRAINING FOCUS</Text>
            <Text style={styles.insightValue}>{trainingFocus.name}</Text>
            <Text style={styles.insightDetail}>
              {trainingFocus.percentage}% of your sessions
            </Text>
          </View>
        )}

        {/* Intensity Profile */}
        {dominantDifficulty && (
          <View style={styles.insightSection}>
            <Text style={styles.insightLabel}>INTENSITY PROFILE</Text>
            <View style={styles.intensityRow}>
              <Text style={styles.intensityValue}>{dominantDifficulty.name}</Text>
              <Text style={styles.intensityIndicator}>dominant</Text>
            </View>
            {workoutStats?.workouts_by_difficulty && (
              <View style={styles.difficultyBreakdown}>
                {Object.entries(workoutStats.workouts_by_difficulty)
                  .sort((a, b) => b[1] - a[1])
                  .map(([difficulty, count], index) => {
                    const total = Object.values(workoutStats.workouts_by_difficulty).reduce((a, b) => a + b, 0);
                    const percentage = Math.round((count / total) * 100);
                    return (
                      <View key={difficulty} style={styles.difficultyItem}>
                        <View style={styles.difficultyBar}>
                          <View 
                            style={[
                              styles.difficultyFill, 
                              { width: `${percentage}%` },
                              index === 0 && styles.difficultyFillPrimary
                            ]} 
                          />
                        </View>
                        <Text style={styles.difficultyText}>
                          {difficulty} {percentage}%
                        </Text>
                      </View>
                    );
                  })}
              </View>
            )}
          </View>
        )}

        {/* Social Presence */}
        <View style={styles.socialSection}>
          <Text style={styles.socialLabel}>COMMUNITY</Text>
          <View style={styles.socialRow}>
            <View style={styles.socialItem}>
              <Text style={styles.socialValue}>{socialStats?.current_followers || 0}</Text>
              <Text style={styles.socialItemLabel}>Followers</Text>
            </View>
            <View style={styles.socialDivider} />
            <View style={styles.socialItem}>
              <Text style={styles.socialValue}>{socialStats?.current_following || 0}</Text>
              <Text style={styles.socialItemLabel}>Following</Text>
            </View>
            <View style={styles.socialDivider} />
            <View style={styles.socialItem}>
              <Text style={styles.socialValue}>{socialStats?.posts_created || 0}</Text>
              <Text style={styles.socialItemLabel}>Posts</Text>
            </View>
          </View>
          {(socialStats?.engagement_score || 0) > 0 && (
            <Text style={styles.socialHint}>
              {socialStats?.engagement_score} engagement score this period
            </Text>
          )}
        </View>

        {/* Activity Summary - Minimal */}
        <View style={styles.activitySection}>
          <Text style={styles.activityLabel}>PERIOD ACTIVITY</Text>
          <View style={styles.activityGrid}>
            <View style={styles.activityItem}>
              <Text style={styles.activityValue}>{activityStats?.total_workouts || 0}</Text>
              <Text style={styles.activityItemLabel}>Sessions</Text>
            </View>
            <View style={styles.activityItem}>
              <Text style={styles.activityValue}>{activityStats?.total_posts || 0}</Text>
              <Text style={styles.activityItemLabel}>Posts</Text>
            </View>
            <View style={styles.activityItem}>
              <Text style={styles.activityValue}>{activityStats?.total_likes || 0}</Text>
              <Text style={styles.activityItemLabel}>Likes</Text>
            </View>
            <View style={styles.activityItem}>
              <Text style={styles.activityValue}>{activityStats?.total_comments || 0}</Text>
              <Text style={styles.activityItemLabel}>Comments</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  
  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 40,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  periodButtonActive: {
    borderBottomWidth: 1,
    borderBottomColor: '#FFD700',
  },
  periodText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  periodTextActive: {
    color: '#fff',
  },

  // Hero Section
  heroSection: {
    marginBottom: 48,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  heroValue: {
    fontSize: 72,
    fontWeight: '200',
    color: '#fff',
    lineHeight: 80,
  },
  heroUnit: {
    fontSize: 18,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 12,
  },
  heroDelta: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFD700',
  },

  // Metrics Row
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 48,
    paddingVertical: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.3,
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  // Insight Sections
  insightSection: {
    marginBottom: 40,
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  insightValue: {
    fontSize: 24,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  insightDetail: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // Intensity
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  intensityValue: {
    fontSize: 24,
    fontWeight: '500',
    color: '#fff',
    marginRight: 8,
  },
  intensityIndicator: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFD700',
  },
  difficultyBreakdown: {
    gap: 8,
  },
  difficultyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  difficultyBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  difficultyFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
  },
  difficultyFillPrimary: {
    backgroundColor: '#FFD700',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    width: 100,
  },

  // Social Section
  socialSection: {
    marginBottom: 40,
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  socialLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialItem: {
    flex: 1,
    alignItems: 'center',
  },
  socialValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  socialItemLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  socialDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  socialHint: {
    fontSize: 12,
    fontWeight: '400',
    color: '#FFD700',
    marginTop: 12,
    textAlign: 'center',
  },
  socialText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.4)',
  },

  // Activity Section
  activitySection: {
    marginBottom: 24,
  },
  activityLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  activityItem: {
    width: '50%',
    paddingVertical: 12,
  },
  activityValue: {
    fontSize: 20,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  activityItemLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.4)',
  },

  bottomPadding: {
    height: 60,
  },
});
