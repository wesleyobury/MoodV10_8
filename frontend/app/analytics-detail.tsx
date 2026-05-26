import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import Constants from 'expo-constants';

import { API_URL } from '../utils/apiConfig';

// Screen name mapping for user-friendly display
const screenNameMap: { [key: string]: string } = {
  'index': 'Home',
  'explore': 'Explore',
  'profile': 'Profile',
  'cart': 'Workout Cart',
  'workout-session': 'Workout Session',
  'create-post': 'Create Post',
  'admin-dashboard': 'Admin Dashboard',
  'featured-workout-detail': 'Featured Workout',
  'user-profile': 'User Profile',
  'settings': 'Settings',
};

const getDisplayScreenName = (screenName: string): string => {
  return screenNameMap[screenName] || screenName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Mood name mapping for user-friendly display
const moodNameMap: { [key: string]: string } = {
  'sweat': 'Sweat / Burn Fat',
  'muscle': 'Muscle Gainer',
  'outdoor': 'Get Outside',
  'calisthenics': 'Calisthenics',
  'lazy': 'Feeling Lazy',
  'explosive': 'Get Explosive',
};

const getDisplayMoodName = (moodId: string): string => {
  return moodNameMap[moodId] || moodId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Type definitions
interface UserItem {
  user_id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  created_at?: string;
  workouts_completed?: number;
  posts_created?: number;
  app_sessions?: number;
  followers_count?: number;
  following_count?: number;
  count?: number;
}

interface ScreenItem {
  screen_name: string;
  view_count: number;
  unique_users: number;
  percentage: number;
}

interface MoodItem {
  mood: string;
  selection_count: number;
  unique_users: number;
  percentage: number;
}

interface EquipmentItem {
  equipment: string;
  selection_count: number;
  unique_users: number;
  percentage: number;
  top_mood_paths?: { mood: string; count: number }[];
}

interface DifficultyItem {
  difficulty: string;
  selection_count: number;
  unique_users: number;
  percentage: number;
}

interface ExerciseItem {
  exercise_name: string;
  completion_count: number;
  unique_users: number;
  percentage: number;
}

export default function AnalyticsDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const type = params.type as string;
  const days = parseInt(params.days as string) || 30;
  
  const titles: Record<string, string> = {
    users: 'All Users',
    activeUsers: 'Active Users',
    dailyActiveUsers: 'Daily Active Users',
    newUsers: 'New Users',
    screens: 'Screen Views',
    moods: 'Mood Selections',
    equipment: 'Equipment Selections',
    difficulties: 'Difficulty Selections',
    exercises: 'Exercises Completed',
    social: 'Social Activity',
    workoutFunnel: 'Workout Funnel',
  };
  
  const subtitles: Record<string, string> = {
    users: 'All registered accounts on the platform',
    activeUsers: `Users who have used the app in the last ${days} ${days === 1 ? 'day' : 'days'}`,
    dailyActiveUsers: 'Users who were active in the last 24 hours',
    newUsers: `Users who signed up in the last ${days} ${days === 1 ? 'day' : 'days'}`,
    screens: 'Most viewed screens in the app',
    moods: 'Workout mood preferences selected by users',
    equipment: 'Equipment types selected by users',
    difficulties: 'Difficulty levels chosen by users',
    exercises: 'Most completed exercises',
    social: 'Social engagement metrics',
    workoutFunnel: 'User journey through workout flow',
  };

  useEffect(() => {
    fetchData();
  }, [type, days]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    
    const endpoints: Record<string, string> = {
      users: `/api/analytics/admin/users?days=${days}`,
      activeUsers: `/api/analytics/admin/users/active?days=${days}`,
      dailyActiveUsers: `/api/analytics/admin/users/daily-active`,
      newUsers: `/api/analytics/admin/users/new?days=${days}`,
      screens: `/api/analytics/admin/screens?days=${days}`,
      moods: `/api/analytics/admin/moods?days=${days}`,
      equipment: `/api/analytics/admin/equipment?days=${days}`,
      difficulties: `/api/analytics/admin/difficulties?days=${days}`,
      exercises: `/api/analytics/admin/exercises?days=${days}`,
      social: `/api/analytics/admin/social?days=${days}`,
      workoutFunnel: `/api/analytics/admin/workout-funnel?days=${days}`,
    };
    
    try {
      const response = await fetch(`${API_URL}${endpoints[type]}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching detail data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = (item: UserItem, index: number) => (
    <View key={item.user_id} style={styles.listItem}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{index + 1}</Text>
      </View>
      <View style={styles.avatarContainer}>
        {item.avatar_url ? (
          <Image source={{ uri: `${API_URL}${item.avatar_url}` }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={20} color="#666" />
          </View>
        )}
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.username}</Text>
        {item.email && <Text style={styles.itemSubtitle}>{item.email}</Text>}
        {item.workouts_completed !== undefined && (
          <Text style={styles.itemMeta}>
            {item.workouts_completed} workouts • {item.posts_created} posts • {item.app_sessions} sessions
          </Text>
        )}
        {item.count !== undefined && (
          <Text style={styles.itemMeta}>{item.count} actions</Text>
        )}
      </View>
    </View>
  );

  const renderActiveUserItem = (item: any, index: number) => (
    <View key={item.user_id} style={styles.listItem}>
      <View style={[styles.rankBadge, index === 0 && styles.goldBadge]}>
        <Text style={[styles.rankText, index === 0 && styles.goldText]}>{index + 1}</Text>
      </View>
      <View style={styles.avatarContainer}>
        {item.avatar_url ? (
          <Image source={{ uri: `${API_URL}${item.avatar_url}` }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={20} color="#666" />
          </View>
        )}
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.username}</Text>
        {item.email && <Text style={styles.itemSubtitle}>{item.email}</Text>}
        <Text style={styles.itemMeta}>
          {item.app_sessions?.toLocaleString() || 0} events tracked
        </Text>
      </View>
    </View>
  );

  const renderDailyActiveUserItem = (item: any, index: number) => (
    <View key={item.user_id} style={styles.listItem}>
      <View style={[styles.rankBadge, index === 0 && styles.goldBadge]}>
        <Text style={[styles.rankText, index === 0 && styles.goldText]}>{index + 1}</Text>
      </View>
      <View style={styles.avatarContainer}>
        {item.avatar_url ? (
          <Image source={{ uri: `${API_URL}${item.avatar_url}` }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={20} color='#666' />
          </View>
        )}
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.username}</Text>
        {item.email && <Text style={styles.itemSubtitle}>{item.email}</Text>}
        {item.last_active && (
          <Text style={styles.itemMeta}>
            Last active: {new Date(item.last_active).toLocaleTimeString()}
          </Text>
        )}
      </View>
    </View>
  );

  const renderScreenItem = (item: ScreenItem, index: number) => (
    <View key={item.screen_name} style={styles.listItem}>
      <View style={[styles.rankBadge, index === 0 && styles.goldBadge]}>
        <Text style={[styles.rankText, index === 0 && styles.goldText]}>{index + 1}</Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{getDisplayScreenName(item.screen_name)}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statItem}>{item.view_count.toLocaleString()} views</Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.statItem}>{item.unique_users} users</Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.percentage}>{item.percentage}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.percentage}%` }]} />
        </View>
      </View>
    </View>
  );

  const renderMoodItem = (item: MoodItem, index: number) => (
    <View key={item.mood} style={styles.listItem}>
      <View style={[styles.rankBadge, index === 0 && styles.goldBadge]}>
        <Text style={[styles.rankText, index === 0 && styles.goldText]}>{index + 1}</Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{getDisplayMoodName(item.mood) || 'Unknown Mood'}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statItem}>{item.selection_count.toLocaleString()} selections</Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.statItem}>{item.unique_users} users</Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.percentage}>{item.percentage}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.percentage}%`, backgroundColor: '#FFD700' }]} />
        </View>
      </View>
    </View>
  );

  const renderEquipmentItem = (item: EquipmentItem, index: number) => (
    <View key={item.equipment} style={styles.listItem}>
      <View style={[styles.rankBadge, index === 0 && styles.goldBadge]}>
        <Text style={[styles.rankText, index === 0 && styles.goldText]}>{index + 1}</Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.equipment || 'Unknown Equipment'}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statItem}>{item.selection_count.toLocaleString()} selections</Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.statItem}>{item.unique_users} users</Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.percentage}>{item.percentage}%</Text>
        </View>
        {item.top_mood_paths && item.top_mood_paths.length > 0 && (
          <View style={styles.moodPathsContainer}>
            <Text style={styles.moodPathsLabel}>Top paths:</Text>
            {item.top_mood_paths.map((path, i) => (
              <View key={i} style={styles.moodPathTag}>
                <Text style={styles.moodPathText}>{path.mood} ({path.count})</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.percentage}%`, backgroundColor: '#4CAF50' }]} />
        </View>
      </View>
    </View>
  );

  const renderDifficultyItem = (item: DifficultyItem, index: number) => {
    const colors: Record<string, string> = {
      beginner: '#4CAF50',
      intermediate: '#FF9800',
      advanced: '#F44336',
    };
    
    return (
      <View key={item.difficulty} style={styles.listItem}>
        <View style={[styles.rankBadge, { backgroundColor: colors[item.difficulty] || '#FFD700' }]}>
          <Ionicons name="speedometer" size={16} color='#fff' />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statItem}>{item.selection_count.toLocaleString()} selections</Text>
            <Text style={styles.statDivider}>•</Text>
            <Text style={styles.statItem}>{item.unique_users} users</Text>
            <Text style={styles.statDivider}>•</Text>
            <Text style={styles.percentage}>{item.percentage}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${item.percentage}%`, backgroundColor: colors[item.difficulty] || '#FFD700' }]} />
          </View>
        </View>
      </View>
    );
  };

  const renderExerciseItem = (item: ExerciseItem, index: number) => (
    <View key={item.exercise_name} style={styles.listItem}>
      <View style={[styles.rankBadge, index === 0 && styles.goldBadge]}>
        <Text style={[styles.rankText, index === 0 && styles.goldText]}>{index + 1}</Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={2}>{item.exercise_name || 'Unknown Exercise'}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statItem}>{item.completion_count.toLocaleString()} completions</Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.statItem}>{item.unique_users} users</Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.percentage}>{item.percentage}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.percentage}%`, backgroundColor: '#00BCD4' }]} />
        </View>
      </View>
    </View>
  );

  const renderSocialContent = () => {
    if (!data) return null;
    
    return (
      <View>
        <Text style={styles.sectionTitle}>Top Likers</Text>
        {data.top_likers?.map((item: UserItem, index: number) => renderUserItem(item, index))}
        
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Top Commenters</Text>
        {data.top_commenters?.map((item: UserItem, index: number) => renderUserItem(item, index))}
      </View>
    );
  };

  const renderWorkoutFunnelContent = () => {
    if (!data) return null;
    
    return (
      <View>
        <View style={styles.funnelCard}>
          <Text style={styles.funnelLabel}>Users Who Started</Text>
          <Text style={styles.funnelValue}>{data.users_who_started?.toLocaleString() || 0}</Text>
          <Text style={styles.funnelSubtext}>{data.total_starts?.toLocaleString() || 0} total starts</Text>
        </View>
        
        <View style={styles.funnelCard}>
          <Text style={styles.funnelLabel}>Users Who Completed</Text>
          <Text style={[styles.funnelValue, { color: '#4CAF50' }]}>{data.users_who_completed?.toLocaleString() || 0}</Text>
          <Text style={styles.funnelSubtext}>{data.total_completions?.toLocaleString() || 0} total completions</Text>
        </View>
        
        <View style={styles.funnelCard}>
          <Text style={styles.funnelLabel}>Users Who Abandoned</Text>
          <Text style={[styles.funnelValue, { color: '#F44336' }]}>{data.users_who_abandoned?.toLocaleString() || 0}</Text>
          <Text style={styles.funnelSubtext}>{data.total_abandonments?.toLocaleString() || 0} total abandonments</Text>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      );
    }

    if (!data) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={48} color='#666' />
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      );
    }

    switch (type) {
      case 'users':
        return data.users?.map((item: UserItem, index: number) => renderUserItem(item, index));
      case 'newUsers':
        return data.users?.map((item: UserItem, index: number) => renderUserItem(item, index));
      case 'activeUsers':
        return data.users?.map((item: UserItem, index: number) => renderActiveUserItem(item, index));
      case 'dailyActiveUsers':
        return data.users?.map((item: UserItem, index: number) => renderDailyActiveUserItem(item, index));
      case 'screens':
        return data.screens?.map((item: ScreenItem, index: number) => renderScreenItem(item, index));
      case 'moods':
        return data.moods?.map((item: MoodItem, index: number) => renderMoodItem(item, index));
      case 'equipment':
        return data.equipment?.map((item: EquipmentItem, index: number) => renderEquipmentItem(item, index));
      case 'difficulties':
        return data.difficulties?.map((item: DifficultyItem, index: number) => renderDifficultyItem(item, index));
      case 'exercises':
        return data.exercises?.map((item: ExerciseItem, index: number) => renderExerciseItem(item, index));
      case 'social':
        return renderSocialContent();
      case 'workoutFunnel':
        return renderWorkoutFunnelContent();
      default:
        return null;
    }
  };

  const getTotalCount = () => {
    if (!data) return 0;
    switch (type) {
      case 'users':
      case 'newUsers':
        return data.total_count || data.users?.length || 0;
      case 'activeUsers':
      case 'dailyActiveUsers':
        return data.total || data.users?.length || 0;
      case 'screens':
        return data.total_views || 0;
      case 'moods':
        return data.total_selections || 0;
      case 'equipment':
        return data.total_selections || 0;
      case 'difficulties':
        return data.total_selections || 0;
      case 'exercises':
        return data.total_completions || 0;
      default:
        return 0;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color='#FFD700' />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{titles[type] || 'Details'}</Text>
          <Text style={styles.headerSubtitle}>
            {subtitles[type] || `Last ${days === 1 ? '24 hours' : `${days} days`}`}
          </Text>
          {getTotalCount() > 0 && (
            <Text style={styles.headerCount}>{getTotalCount().toLocaleString()} total</Text>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  headerCount: {
    fontSize: 11,
    color: '#FFD700',
    marginTop: 4,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goldBadge: {
    backgroundColor: '#FFD700',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
  },
  goldText: {
    color: '#000',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 11,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  statItem: {
    fontSize: 12,
    color: '#888',
  },
  statDivider: {
    fontSize: 12,
    color: '#444',
    marginHorizontal: 6,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  moodPathsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodPathsLabel: {
    fontSize: 11,
    color: '#666',
    marginRight: 6,
  },
  moodPathTag: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  moodPathText: {
    fontSize: 10,
    color: '#FFD700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  funnelCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
  },
  funnelLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  funnelValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFD700',
  },
  funnelSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  bottomPadding: {
    height: 40,
  },
});
