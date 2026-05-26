import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { BarChart, LineChart } from 'react-native-chart-kit';
import BackButton from '../components/BackButton';

import { API_URL } from '../utils/apiConfig';
import {
  secureStorage,
  AUTH_TOKEN_KEY,
  AUTH_TOKEN_STORED_AT_KEY,
  AUTH_TOKEN_LAST_VALIDATED_KEY,
} from '../utils/secureStorage';
const screenWidth = Dimensions.get('window').width;

const ADMIN_USERNAME = 'officialmoodapp';

// Time period options - 0 means 'all time'
const TIME_PERIODS = [
  { value: 1, label: 'Today', shortLabel: '1D' },
  { value: 7, label: 'This Week', shortLabel: '7D' },
  { value: 30, label: 'This Month', shortLabel: '30D' },
  { value: 90, label: '90 Days', shortLabel: '90D' },
  { value: 0, label: 'All Time', shortLabel: 'All' },
];

// Mood colors - EXACT match from home screen mood cards gradients (first color)
const MOOD_COLORS: Record<string, string> = {
  'sweat': '#FF6B6B',      // Sweat / burn fat - flame gradient
  'muscle': '#4ECDC4',     // Muscle gainer - teal gradient  
  'explosive': '#FFD93D',  // Build explosion - yellow gradient
  'lazy': '#D299C2',       // Feeling lazy - purple/pink gradient
  'calisthenics': '#667eea', // Calisthenics - purple/indigo gradient
  'outdoor': '#56ab2f',    // Get outside - green gradient
  'ringer': '#888888',     // Take me through the ringer - dark/skull
};

// Mood icons - EXACT match from home screen mood cards
const MOOD_ICONS: Record<string, string> = {
  'sweat': 'flame',        // Sweat / burn fat
  'muscle': 'barbell',     // Muscle gainer
  'explosive': 'flash',    // Build explosion
  'lazy': 'bed',           // Feeling lazy
  'calisthenics': 'body',  // Calisthenics
  'outdoor': 'bicycle',    // Get outside
  'ringer': 'skull',       // Take me through the ringer
};

// Display names for moods
const MOOD_DISPLAY_NAMES: Record<string, string> = {
  'sweat': 'Sweat / burn fat',
  'muscle': 'Muscle gainer',
  'explosive': 'Build explosion',
  'lazy': "I'm feeling lazy",
  'calisthenics': 'Calisthenics',
  'outdoor': 'Get outside',
  'ringer': 'Through the Ringer',
};

interface ComprehensiveStats {
  period_days: number;
  total_users: number;
  new_users: number;
  realtime_active_users: number;
  users_with_activity: number;
  total_sessions: number;
  total_screen_views: number;
  top_pages: { page: string; views: number; unique_users: number }[];
  total_mood_selections: number;
  top_mood_cards: { mood: string; mood_id: string; selections: number; unique_users: number }[];
  workouts_added: number;
  workouts_started: number;
  workouts_completed: number;
  workout_completion_rate: number;
  posts_created: number;
  total_likes: number;
  total_comments: number;
  total_follows: number;
  // Guest metrics
  guest_signins: number;
  unique_guest_devices: number;
  guest_conversions: number;
}

interface UserItem {
  user_id: string;
  username: string;
  email: string;
  avatar_url?: string;
  avatar?: string;
  created_at?: string;
  last_active?: string;
  events_count: number;
  workouts_completed: number;
  posts_created: number;
  followers_count: number;
}

interface ActiveUser {
  user_id: string;
  username: string;
  avatar_url?: string;
  avatar?: string;
  last_active?: string;
}

interface ChartDataset {
  label: string;
  data: number[];
}

interface ChartData {
  chart_type: string;
  labels: string[];
  datasets: ChartDataset[];
}

interface UserReport {
  user: {
    user_id: string;
    username: string;
    email: string;
    avatar_url?: string;
    avatar?: string;
    created_at?: string;
    followers_count: number;
    following_count: number;
  };
  period_days: number;
  is_all_time?: boolean;
  report: {
    workouts_added_to_cart: number;
    workouts_started: number;
    workouts_completed: number;
    workout_completion_rate: number;
    total_screen_views: number;
    unique_screens_viewed: number;
    top_screens: { screen: string; views: number; percentage?: number }[];
    app_sessions: number;
    total_time_seconds: number;
    time_spent_formatted: string;
    posts_created: number;
    likes_given: number;
    comments_made: number;
    follows_given: number;
    mood_selections: number;
    last_active?: string;
  };
}

interface BuildForMeStats {
  period_days: number;
  total_generations: number;
  unique_users: number;
  today_generations: number;
  by_mood_card: { mood: string; display_name: string; count: number; unique_users: number }[];
  by_intensity: { intensity: string; count: number }[];
  avg_per_user: number;
}

interface CustomWorkoutsStats {
  period_days: number;
  total_custom_workouts: number;
  unique_users: number;
  by_mood_card: { mood: string; count: number }[];
}

// Helper to convert UTC to CST
function formatDateToCST(dateStr?: string): string {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  // CST is UTC-6
  return date.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) + ' CST';
}

// Helper to get avatar URL - handles both avatar_url and avatar fields
function getAvatarUri(avatarUrl?: string, avatar?: string): string | null {
  const url = avatarUrl || avatar;
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'users' | 'guests'>('all');
  
  // Data states
  const [stats, setStats] = useState<ComprehensiveStats | null>(null);
  const [realtimeActiveCount, setRealtimeActiveCount] = useState(0);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [userGrowthChart, setUserGrowthChart] = useState<ChartData | null>(null);
  const [moodChart, setMoodChart] = useState<ChartData | null>(null);
  const [sessionChart, setSessionChart] = useState<ChartData | null>(null);
  
  // User list modal state
  const [showUserList, setShowUserList] = useState(false);
  const [userListType, setUserListType] = useState<'all' | 'new' | 'active'>('all');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  
  // User report modal state
  const [showUserReport, setShowUserReport] = useState(false);
  const [userReport, setUserReport] = useState<UserReport | null>(null);
  const [userReportLoading, setUserReportLoading] = useState(false);
  const [userReportPeriod, setUserReportPeriod] = useState(1);
  const [currentReportUserId, setCurrentReportUserId] = useState<string | null>(null);
  
  // Active users modal state
  const [showActiveUsers, setShowActiveUsers] = useState(false);
  
  // Deleted users tracking state
  const [deletedUsersCount, setDeletedUsersCount] = useState(0);
  const [deletedUsers, setDeletedUsers] = useState<any[]>([]);
  const [showDeletedUsers, setShowDeletedUsers] = useState(false);
  
  // Session chart modal state
  const [showSessionChart, setShowSessionChart] = useState(false);
  
  // Engagement chart modal state
  const [showEngagementChart, setShowEngagementChart] = useState(false);
  const [engagementChartType, setEngagementChartType] = useState<string>('workouts_added');
  const [engagementChartTitle, setEngagementChartTitle] = useState<string>('Workouts Added');
  const [engagementChartData, setEngagementChartData] = useState<ChartData | null>(null);
  const [engagementChartPeriod, setEngagementChartPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [engagementChartLoading, setEngagementChartLoading] = useState(false);
  
  // Chart period for growth/mood charts
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week' | 'month'>('day');
  
  // Completions by Mood widget state
  const [completionsByMoodData, setCompletionsByMoodData] = useState<ChartData | null>(null);
  const [completionsByMoodPeriod, setCompletionsByMoodPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [completionsByMoodLoading, setCompletionsByMoodLoading] = useState(false);
  const [showCompletionsByMoodModal, setShowCompletionsByMoodModal] = useState(false);
  
  // Build for Me stats widget state
  const [buildForMeStats, setBuildForMeStats] = useState<BuildForMeStats | null>(null);
  const [buildForMeLoading, setBuildForMeLoading] = useState(false);
  const [showBuildForMeModal, setShowBuildForMeModal] = useState(false);
  
  // Custom Workouts stats widget state
  const [customWorkoutsStats, setCustomWorkoutsStats] = useState<CustomWorkoutsStats | null>(null);
  
  // Try Workout Clicks widget state
  const [tryWorkoutStats, setTryWorkoutStats] = useState<{
    total_clicks: number;
    unique_users: number;
    today_clicks: number;
    this_week_clicks: number;
    by_source: { source: string; clicks: number }[];
  } | null>(null);
  const [showTryWorkoutModal, setShowTryWorkoutModal] = useState(false);
  
  // Workout Session Completions widget state
  const [sessionCompletionStats, setSessionCompletionStats] = useState<{
    total_completions: number;
    unique_users: number;
    today_completions: number;
    this_week_completions: number;
    avg_duration_seconds: number;
    by_difficulty: { difficulty: string; completions: number }[];
  } | null>(null);
  const [showSessionCompletionModal, setShowSessionCompletionModal] = useState(false);
  
  // Workout Engagement Chart state
  const [workoutEngagementChart, setWorkoutEngagementChart] = useState<{
    period: string;
    days: number;
    data: {
      date: string;
      try_clicks: number;
      try_unique_users: number;
      completions: number;
      completion_unique_users: number;
    }[];
  } | null>(null);
  
  // Debug Panel state - shows API base URL and meta info
  const [debugMeta, setDebugMeta] = useState<{
    env?: string;
    seed_version_applied?: string;
    mongo_db_name?: string;
    error?: string;
  } | null>(null);
  
  // Admin auth status
  const [adminAuthInfo, setAdminAuthInfo] = useState<{
    username?: string;
    email?: string;
    is_admin_effective?: boolean;
    admin_matched_by?: string;
    admin_allowlist?: string[];
  } | null>(null);

  // Session diagnostics (visible only to the officialmoodapp admin).
  // Tracks how the auth token is persisted client-side so silent-logout
  // reports can be diagnosed without another TestFlight build.
  const [sessionDiag, setSessionDiag] = useState<{
    storage_backend: string;
    token_present: boolean;
    token_tail: string | null;
    stored_at: string | null;
    last_validated_at: string | null;
    age_label: string;
    last_validated_label: string;
  } | null>(null);
  
  // Heartbeat interval
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch debug meta info on mount
  useEffect(() => {
    const fetchDebugMeta = async () => {
      try {
        const response = await fetch(`${API_URL}/api/meta`);
        if (response.ok) {
          const data = await response.json();
          setDebugMeta({
            env: data.env,
            seed_version_applied: data.seed_version_applied,
            mongo_db_name: data.mongo_db_name,
          });
        } else {
          setDebugMeta({ error: `HTTP ${response.status}` });
        }
      } catch (error: any) {
        setDebugMeta({ error: error.message || 'Failed to fetch' });
      }
    };
    
    fetchDebugMeta();
  }, []);

  // Populate Session Diagnostics — only meaningful for admin; cheap enough to always run.
  useEffect(() => {
    const fmtAge = (iso: string | null): string => {
      if (!iso) return 'never';
      const t = Date.parse(iso);
      if (Number.isNaN(t)) return 'invalid';
      const secs = Math.max(0, Math.floor((Date.now() - t) / 1000));
      if (secs < 60) return `${secs}s ago`;
      const mins = Math.floor(secs / 60);
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    };

    const loadDiag = async () => {
      try {
        const [storedToken, storedAt, lastValidated] = await Promise.all([
          secureStorage.get(AUTH_TOKEN_KEY),
          secureStorage.get(AUTH_TOKEN_STORED_AT_KEY),
          secureStorage.get(AUTH_TOKEN_LAST_VALIDATED_KEY),
        ]);
        setSessionDiag({
          storage_backend: secureStorage.backendLabel,
          token_present: !!storedToken,
          token_tail: storedToken ? `…${storedToken.slice(-8)}` : null,
          stored_at: storedAt,
          last_validated_at: lastValidated,
          age_label: fmtAge(storedAt),
          last_validated_label: fmtAge(lastValidated),
        });
      } catch (e) {
        // Best-effort — diagnostics only
        console.warn('Session diagnostics load failed:', e);
      }
    };

    loadDiag();
    const intervalId = setInterval(loadDiag, 30000); // refresh every 30s for live "ago" labels
    return () => clearInterval(intervalId);
  }, [token]);

  // Check authorization via API - now using /api/auth/me for detailed admin info
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!token) {
        setIsAuthorized(false);
        return;
      }
      
      try {
        // Use the new /api/auth/me endpoint for detailed admin info
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Store admin auth info for display
          setAdminAuthInfo({
            username: data.username,
            email: data.email,
            is_admin_effective: data.is_admin_effective,
            admin_matched_by: data.admin_matched_by,
            admin_allowlist: data.admin_allowlist,
          });
          
          const authorized = data.is_admin_effective === true;
          setIsAuthorized(authorized);
          
          if (!authorized) {
            Alert.alert(
              'Access Denied',
              `You do not have admin permission.\n\nLogged in as: ${data.username}\nEmail: ${data.email}\nCheck result: ${data.admin_matched_by}\nAllowlist: ${data.admin_allowlist?.join(', ')}`,
              [{ text: 'OK', onPress: () => router.back() }]
            );
          }
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAuthorized(false);
      }
    };
    
    checkAdminStatus();
  }, [token]);

  // Send heartbeat for real-time tracking
  useEffect(() => {
    if (!token || !isAuthorized) return;
    
    const sendHeartbeat = async () => {
      try {
        await fetch(`${API_URL}/api/analytics/heartbeat`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (error) {
        console.log('Heartbeat error:', error);
      }
    };
    
    // Send initial heartbeat
    sendHeartbeat();
    
    // Set up interval
    heartbeatRef.current = setInterval(sendHeartbeat, 120000); // Every 2 minutes
    
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [token, isAuthorized]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    if (!token || !isAuthorized) return;
    
    try {
      // Fetch comprehensive stats with user type filter
      const statsResponse = await fetch(
        `${API_URL}/api/analytics/admin/comprehensive-stats?days=${selectedPeriod}&user_type=${userTypeFilter}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
      
      // Fetch real-time active users with details
      const realtimeResponse = await fetch(
        `${API_URL}/api/analytics/admin/realtime-active?timeout_minutes=5`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (realtimeResponse.ok) {
        const realtimeData = await realtimeResponse.json();
        setRealtimeActiveCount(realtimeData.active_count || 0);
        setActiveUsers(realtimeData.users || []);
      }
      
      // Fetch chart data - always use 'day' for session chart as requested
      const chartDays = chartPeriod === 'month' ? 365 : chartPeriod === 'week' ? 180 : 30;
      
      const [userGrowthRes, moodRes, sessionRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics/admin/chart-data/user_growth?period=${chartPeriod}&days=${chartDays}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/analytics/admin/chart-data/mood_distribution?period=${chartPeriod}&days=${chartDays}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        // Session chart always uses daily data
        fetch(`${API_URL}/api/analytics/admin/chart-data/session_trend?period=day&days=30`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);
      
      if (userGrowthRes.ok) {
        setUserGrowthChart(await userGrowthRes.json());
      }
      if (moodRes.ok) {
        setMoodChart(await moodRes.json());
      }
      if (sessionRes.ok) {
        setSessionChart(await sessionRes.json());
      }
      
      // Fetch Build for Me stats
      try {
        const buildForMeRes = await fetch(
          `${API_URL}/api/analytics/admin/build-for-me-stats?days=${selectedPeriod}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (buildForMeRes.ok) {
          setBuildForMeStats(await buildForMeRes.json());
        }
      } catch (bfmError) {
        console.log('Build for Me stats fetch error:', bfmError);
      }
      
      // Fetch Custom Workouts stats
      try {
        const customWorkoutsRes = await fetch(
          `${API_URL}/api/analytics/admin/custom-workouts-stats?days=${selectedPeriod}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (customWorkoutsRes.ok) {
          setCustomWorkoutsStats(await customWorkoutsRes.json());
        }
      } catch (cwError) {
        console.log('Custom Workouts stats fetch error:', cwError);
      }
      
      // Fetch Try Workout Clicks stats
      try {
        const tryWorkoutRes = await fetch(
          `${API_URL}/api/analytics/admin/try-workout-stats?days=${selectedPeriod}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (tryWorkoutRes.ok) {
          setTryWorkoutStats(await tryWorkoutRes.json());
        }
      } catch (twError) {
        console.log('Try Workout stats fetch error:', twError);
      }
      
      // Fetch Session Completion stats
      try {
        const sessionCompletionRes = await fetch(
          `${API_URL}/api/analytics/admin/session-completion-stats?days=${selectedPeriod}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (sessionCompletionRes.ok) {
          setSessionCompletionStats(await sessionCompletionRes.json());
        }
      } catch (scError) {
        console.log('Session Completion stats fetch error:', scError);
      }
      
      // Fetch Workout Engagement Chart data
      try {
        const engagementChartRes = await fetch(
          `${API_URL}/api/analytics/admin/workout-engagement-chart?period=${engagementChartPeriod}&days=${selectedPeriod}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (engagementChartRes.ok) {
          setWorkoutEngagementChart(await engagementChartRes.json());
        }
      } catch (ecError) {
        console.log('Workout engagement chart fetch error:', ecError);
      }
      
      // Fetch deleted users stats
      try {
        const deletedUsersRes = await fetch(
          `${API_URL}/api/analytics/admin/deleted-users?days=${selectedPeriod}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (deletedUsersRes.ok) {
          const deletedData = await deletedUsersRes.json();
          setDeletedUsersCount(deletedData.total_count || 0);
          setDeletedUsers(deletedData.deleted_users || []);
        }
      } catch (duError) {
        console.log('Deleted users fetch error:', duError);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, isAuthorized, selectedPeriod, chartPeriod, userTypeFilter, engagementChartPeriod]);

  useEffect(() => {
    if (isAuthorized) {
      fetchAllData();
    }
  }, [fetchAllData, isAuthorized]);

  // Refetch engagement chart when period changes
  useEffect(() => {
    const fetchEngagementChart = async () => {
      if (!token || !isAuthorized) return;
      try {
        const engagementChartRes = await fetch(
          `${API_URL}/api/analytics/admin/workout-engagement-chart?period=${engagementChartPeriod}&days=${selectedPeriod}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (engagementChartRes.ok) {
          setWorkoutEngagementChart(await engagementChartRes.json());
        }
      } catch (ecError) {
        console.log('Workout engagement chart fetch error:', ecError);
      }
    };
    fetchEngagementChart();
  }, [engagementChartPeriod, token, isAuthorized, selectedPeriod]);

  // Fetch users for modal
  const fetchUsers = async (type: 'all' | 'new' | 'active', search: string = '') => {
    if (!token) return;
    setUsersLoading(true);
    
    try {
      let endpoint = '';
      if (type === 'all') {
        endpoint = `/api/analytics/admin/users/list?days=${selectedPeriod}&limit=50&search=${search}`;
      } else if (type === 'new') {
        endpoint = `/api/analytics/admin/users/list?days=${selectedPeriod}&limit=50&sort_by=created_at&sort_order=desc`;
      } else {
        endpoint = `/api/analytics/admin/users/list?days=${selectedPeriod}&limit=50`;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalUsersCount(data.total_count || data.total || data.users?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const openUserList = (type: 'all' | 'new' | 'active') => {
    setUserListType(type);
    setUserSearchQuery('');
    setShowUserList(true);
    fetchUsers(type);
  };

  // Delete user function
  const deleteUser = async (userId: string, username: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete '${username}'?\n\nThis user's profile will be stored safely for 7 days and can be recovered if needed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/analytics/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (response.ok) {
                const data = await response.json();
                Alert.alert(
                  'User Deleted',
                  `${username} has been deleted.\n\nRecoverable until: ${new Date(data.recoverable_until).toLocaleString('en-US', {
                    timeZone: 'America/Chicago',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })} CT`,
                  [{ text: 'OK' }]
                );
                // Refresh user list
                fetchUsers(userListType, userSearchQuery);
                // Refresh stats
                fetchAllData();
              } else {
                const error = await response.json();
                Alert.alert('Error', error.detail || 'Failed to delete user');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Open engagement chart modal
  const openEngagementChart = async (chartType: string, title: string) => {
    setEngagementChartType(chartType);
    setEngagementChartTitle(title);
    setShowEngagementChart(true);
    fetchEngagementChartData(chartType, engagementChartPeriod);
  };

  // Fetch engagement chart data
  const fetchEngagementChartData = async (chartType: string, period: 'day' | 'week' | 'month') => {
    if (!token) return;
    setEngagementChartLoading(true);
    
    try {
      const days = period === 'month' ? 365 : period === 'week' ? 180 : 30;
      const response = await fetch(
        `${API_URL}/api/analytics/admin/chart-data/${chartType}?period=${period}&days=${days}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setEngagementChartData(data);
      }
    } catch (error) {
      console.error('Error fetching engagement chart:', error);
    } finally {
      setEngagementChartLoading(false);
    }
  };

  // Handle engagement chart period change
  useEffect(() => {
    if (showEngagementChart && engagementChartType) {
      fetchEngagementChartData(engagementChartType, engagementChartPeriod);
    }
  }, [engagementChartPeriod]);

  // Fetch completions by mood data
  const fetchCompletionsByMoodData = async (period: 'day' | 'week' | 'month') => {
    if (!token) return;
    setCompletionsByMoodLoading(true);
    
    try {
      const days = period === 'month' ? 365 : period === 'week' ? 180 : 30;
      const response = await fetch(
        `${API_URL}/api/analytics/admin/chart-data/completions_by_mood?period=${period}&days=${days}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setCompletionsByMoodData(data);
      }
    } catch (error) {
      console.error('Error fetching completions by mood:', error);
    } finally {
      setCompletionsByMoodLoading(false);
    }
  };

  // Handle completions by mood period change
  useEffect(() => {
    if (showCompletionsByMoodModal) {
      fetchCompletionsByMoodData(completionsByMoodPeriod);
    }
  }, [completionsByMoodPeriod, showCompletionsByMoodModal]);

  // Export users as CSV
  const exportUsers = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(
        `${API_URL}/api/analytics/admin/export/users?days=${selectedPeriod}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          'Export Ready',
          `${data.count} users exported. In production, this would download as CSV.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export users data.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  // Fetch user report when clicking on a user
  const fetchUserReport = async (userId: string, period?: number) => {
    if (!token) return;
    setUserReportLoading(true);
    setShowUserReport(true);
    setCurrentReportUserId(userId);
    
    const reportPeriod = period !== undefined ? period : userReportPeriod;
    
    try {
      const response = await fetch(
        `${API_URL}/api/analytics/admin/users/${userId}/report?days=${reportPeriod}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setUserReport(data);
      } else {
        Alert.alert('Error', 'Failed to load user report');
        setShowUserReport(false);
      }
    } catch (error) {
      console.error('Error fetching user report:', error);
      Alert.alert('Error', 'Failed to load user report');
      setShowUserReport(false);
    } finally {
      setUserReportLoading(false);
    }
  };

  // Handle user report period change
  const handleReportPeriodChange = (period: number) => {
    setUserReportPeriod(period);
    if (currentReportUserId) {
      fetchUserReport(currentReportUserId, period);
    }
  };

  if (!isAuthorized) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color='#FFD700' />
        <Text style={styles.loadingText}>Loading Analytics...</Text>
      </View>
    );
  }

  // Chart configurations
  const chartConfig = {
    backgroundColor: '#1a1a1a',
    backgroundGradientFrom: '#1a1a1a',
    backgroundGradientTo: '#1a1a1a',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: { borderRadius: 12 },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#333',
    },
    barPercentage: 0.6,
  };

  // Calculate total mood selections for percentage
  const totalMoodSelections = moodChart?.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Analytics Dashboard</Text>
          <Text style={styles.headerSubtitle}>Board-Ready Insights</Text>
        </View>
        <TouchableOpacity onPress={exportUsers} style={styles.exportButton}>
          <Ionicons name="download-outline" size={22} color='#FFD700' />
        </TouchableOpacity>
      </View>

      {/* Debug Panel - Shows API configuration and Admin Auth Status */}
      <View style={styles.debugPanel}>
        <Text style={styles.debugTitle}>🔧 Debug Info</Text>
        <Text style={styles.debugText}>
          <Text style={styles.debugLabel}>Backend: </Text>
          <Text style={styles.debugValue}>{API_URL || 'NOT SET'}</Text>
        </Text>
        <Text style={styles.debugText}>
          <Text style={styles.debugLabel}>Env: </Text>
          <Text style={styles.debugValue}>{debugMeta?.env || debugMeta?.error || 'loading...'}</Text>
        </Text>
        <Text style={styles.debugText}>
          <Text style={styles.debugLabel}>Seed: </Text>
          <Text style={[styles.debugValue, debugMeta?.seed_version_applied === 'none' && styles.debugWarning]}>
            {debugMeta?.seed_version_applied || 'loading...'}
          </Text>
        </Text>
        <Text style={styles.debugText}>
          <Text style={styles.debugLabel}>DB: </Text>
          <Text style={styles.debugValue}>{debugMeta?.mongo_db_name || 'loading...'}</Text>
        </Text>
        {/* Admin Auth Info */}
        <View style={styles.debugDivider} />
        <Text style={styles.debugText}>
          <Text style={styles.debugLabel}>Logged in as: </Text>
          <Text style={styles.debugValue}>{adminAuthInfo?.username || user?.username || 'loading...'}</Text>
        </Text>
        <Text style={styles.debugText}>
          <Text style={styles.debugLabel}>Admin effective: </Text>
          <Text style={[
            styles.debugValue, 
            adminAuthInfo?.is_admin_effective ? styles.debugSuccess : styles.debugWarning
          ]}>
            {adminAuthInfo?.is_admin_effective === undefined ? 'loading...' : adminAuthInfo.is_admin_effective ? '✅ true' : '❌ false'}
          </Text>
        </Text>
        <Text style={styles.debugText}>
          <Text style={styles.debugLabel}>Matched by: </Text>
          <Text style={styles.debugValue}>{adminAuthInfo?.admin_matched_by || 'loading...'}</Text>
        </Text>
        <Text style={styles.debugText}>
          <Text style={styles.debugLabel}>Allowlist: </Text>
          <Text style={styles.debugValue}>{adminAuthInfo?.admin_allowlist?.join(', ') || 'loading...'}</Text>
        </Text>

        {/* Session Diagnostics — only for the officialmoodapp admin */}
        {user?.username?.toLowerCase() === ADMIN_USERNAME.toLowerCase() && (
          <>
            <View style={styles.debugDivider} />
            <Text style={[styles.debugTitle, { fontSize: 13, marginBottom: 4 }]} testID="session-diag-heading">
              🧭 Session Diagnostics
            </Text>
            <Text style={styles.debugText} testID="session-diag-storage">
              <Text style={styles.debugLabel}>Storage: </Text>
              <Text style={styles.debugValue}>{sessionDiag?.storage_backend || 'loading...'}</Text>
            </Text>
            <Text style={styles.debugText} testID="session-diag-token">
              <Text style={styles.debugLabel}>Token: </Text>
              <Text style={[
                styles.debugValue,
                sessionDiag && !sessionDiag.token_present && styles.debugWarning,
                sessionDiag && sessionDiag.token_present && styles.debugSuccess,
              ]}>
                {sessionDiag
                  ? sessionDiag.token_present
                    ? `✅ present (${sessionDiag.token_tail})`
                    : '❌ missing'
                  : 'loading...'}
              </Text>
            </Text>
            <Text style={styles.debugText} testID="session-diag-age">
              <Text style={styles.debugLabel}>Token age: </Text>
              <Text style={styles.debugValue}>
                {sessionDiag?.age_label || 'loading...'}
                {sessionDiag?.stored_at ? `  (${sessionDiag.stored_at})` : ''}
              </Text>
            </Text>
            <Text style={styles.debugText} testID="session-diag-validated">
              <Text style={styles.debugLabel}>Last validated: </Text>
              <Text style={styles.debugValue}>
                {sessionDiag?.last_validated_label || 'loading...'}
                {sessionDiag?.last_validated_at ? `  (${sessionDiag.last_validated_at})` : ''}
              </Text>
            </Text>
          </>
        )}
      </View>

      {/* Add Workout (Admin Tools) */}
      <TouchableOpacity
        style={styles.addWorkoutCta}
        onPress={() => router.push('/admin-add-workout' as any)}
        testID="admin-go-add-workout"
      >
        <Ionicons name="add-circle" size={20} color="#0c0c0c" />
        <Text style={styles.addWorkoutCtaText}>Add Workout</Text>
        <Ionicons name="chevron-forward" size={18} color="#0c0c0c" />
      </TouchableOpacity>

      {/* Time Period Selector */}
      <View style={styles.periodSelector}>
        {TIME_PERIODS.map(period => (
          <TouchableOpacity
            key={period.value}
            style={[
              styles.periodChip,
              selectedPeriod === period.value && styles.periodChipActive
            ]}
            onPress={() => setSelectedPeriod(period.value)}
          >
            <Text style={[
              styles.periodChipText,
              selectedPeriod === period.value && styles.periodChipTextActive
            ]}>
              {period.shortLabel}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User Type Filter */}
      <View style={styles.userTypeFilter}>
        <Text style={styles.userTypeLabel}>Show:</Text>
        <View style={styles.userTypeButtons}>
          <TouchableOpacity
            style={[styles.userTypeChip, userTypeFilter === 'all' && styles.userTypeChipActive]}
            onPress={() => setUserTypeFilter('all')}
          >
            <Ionicons name='people' size={14} color={userTypeFilter === 'all' ? '#000' : '#888'} />
            <Text style={[styles.userTypeChipText, userTypeFilter === 'all' && styles.userTypeChipTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.userTypeChip, userTypeFilter === 'users' && styles.userTypeChipActive]}
            onPress={() => setUserTypeFilter('users')}
          >
            <Ionicons name='person' size={14} color={userTypeFilter === 'users' ? '#000' : '#888'} />
            <Text style={[styles.userTypeChipText, userTypeFilter === 'users' && styles.userTypeChipTextActive]}>Users</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.userTypeChip, userTypeFilter === 'guests' && styles.userTypeChipActive]}
            onPress={() => setUserTypeFilter('guests')}
          >
            <Ionicons name='eye-outline' size={14} color={userTypeFilter === 'guests' ? '#000' : '#9C27B0'} />
            <Text style={[styles.userTypeChipText, userTypeFilter === 'guests' && styles.userTypeChipTextActive]}>Guests</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor='#FFD700'
          />
        }
      >
        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/admin-push-notifications')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="notifications" size={20} color="#FFD700" />
            </View>
            <Text style={styles.quickActionText}>Send Push Notification</Text>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/admin-exercise-library')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="videocam" size={20} color="#FFD700" />
            </View>
            <Text style={styles.quickActionText}>Exercise Video Library</Text>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Key Metrics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <Text style={styles.sectionSubtitle}>
            {selectedPeriod === 0 ? 'All Time' : selectedPeriod === 1 ? 'Last 24 hours' : `Last ${selectedPeriod} days`}
            {userTypeFilter !== 'all' && ` • ${userTypeFilter === 'users' ? 'Registered Users' : 'Guests'} Only`}
          </Text>
          
          <View style={styles.metricsGrid}>
            {/* Total Users */}
            <TouchableOpacity 
              style={styles.metricCard}
              onPress={() => openUserList('all')}
            >
              <View style={[styles.metricIcon, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
                <Ionicons name="people" size={24} color="#FFD700" />
              </View>
              <Text style={styles.metricValue}>{stats?.total_users?.toLocaleString() || 0}</Text>
              <Text style={styles.metricLabel}>Total Users</Text>
              <View style={styles.metricFooter}>
                <Ionicons name="chevron-forward" size={14} color='#666' />
                <Text style={styles.metricHint}>View all users</Text>
              </View>
            </TouchableOpacity>

            {/* New Users */}
            <TouchableOpacity 
              style={styles.metricCard}
              onPress={() => openUserList('new')}
            >
              <View style={[styles.metricIcon, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                <Ionicons name="person-add" size={24} color='#4CAF50' />
              </View>
              <Text style={styles.metricValue}>{stats?.new_users?.toLocaleString() || 0}</Text>
              <Text style={styles.metricLabel}>New Users</Text>
              <View style={styles.metricFooter}>
                <Text style={styles.metricSubValue}>
                  {selectedPeriod === 1 ? 'today' : `in ${selectedPeriod}d`}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Real-time Active - Opens active users list */}
            <TouchableOpacity 
              style={styles.metricCard}
              onPress={() => setShowActiveUsers(true)}
            >
              <View style={[styles.metricIcon, { backgroundColor: 'rgba(244, 67, 54, 0.15)' }]}>
                <View style={styles.liveDot} />
                <Ionicons name="radio" size={24} color='#F44336' />
              </View>
              <Text style={styles.metricValue}>{realtimeActiveCount}</Text>
              <Text style={styles.metricLabel}>Active Now</Text>
              <View style={styles.metricFooter}>
                <Text style={[styles.metricSubValue, { color: '#F44336' }]}>LIVE</Text>
                <Ionicons name="chevron-forward" size={14} color='#666' />
              </View>
            </TouchableOpacity>

            {/* App Sessions - Opens session chart */}
            <TouchableOpacity 
              style={styles.metricCard}
              onPress={() => setShowSessionChart(true)}
            >
              <View style={[styles.metricIcon, { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}>
                <Ionicons name="phone-portrait" size={24} color="#2196F3" />
              </View>
              <Text style={styles.metricValue}>{stats?.total_sessions?.toLocaleString() || 0}</Text>
              <Text style={styles.metricLabel}>App Sessions</Text>
              <View style={styles.metricFooter}>
                <Text style={styles.metricSubValue}>View chart</Text>
                <Ionicons name="bar-chart-outline" size={14} color="#666" />
              </View>
            </TouchableOpacity>

            {/* Deleted Users - Churn Tracking */}
            <TouchableOpacity 
              style={styles.metricCard}
              onPress={() => setShowDeletedUsers(true)}
            >
              <View style={[styles.metricIcon, { backgroundColor: 'rgba(255, 87, 34, 0.15)' }]}>
                <Ionicons name="person-remove" size={24} color="#FF5722" />
              </View>
              <Text style={styles.metricValue}>{deletedUsersCount}</Text>
              <Text style={styles.metricLabel}>Churned</Text>
              <View style={styles.metricFooter}>
                <Text style={[styles.metricSubValue, { color: '#FF5722' }]}>Deleted accounts</Text>
                <Ionicons name="chevron-forward" size={14} color="#666" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Guest Sign-ins Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Guest Activity</Text>
            <View style={styles.guestBadge}>
              <Ionicons name="eye-outline" size={12} color='#9C27B0' />
              <Text style={styles.guestBadgeText}>Browsing Mode</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>
            Users exploring without an account
          </Text>
          
          <View style={styles.guestMetricsGrid}>
            <View style={styles.guestMetricCard}>
              <View style={[styles.guestMetricIcon, { backgroundColor: 'rgba(156, 39, 176, 0.15)' }]}>
                <Ionicons name="person-outline" size={20} color='#9C27B0' />
              </View>
              <Text style={styles.guestMetricValue}>{stats?.guest_signins || 0}</Text>
              <Text style={styles.guestMetricLabel}>Guest Sign-ins</Text>
            </View>
            
            <View style={styles.guestMetricCard}>
              <View style={[styles.guestMetricIcon, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
                <Ionicons name="phone-portrait-outline" size={20} color='#FF9800' />
              </View>
              <Text style={styles.guestMetricValue}>{stats?.unique_guest_devices || 0}</Text>
              <Text style={styles.guestMetricLabel}>Unique Devices</Text>
            </View>
            
            <View style={styles.guestMetricCard}>
              <View style={[styles.guestMetricIcon, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color='#4CAF50' />
              </View>
              <Text style={styles.guestMetricValue}>{stats?.guest_conversions || 0}</Text>
              <Text style={styles.guestMetricLabel}>Converted to User</Text>
            </View>
          </View>
          
          {/* Conversion Rate */}
          {(stats?.guest_signins || 0) > 0 && (
            <View style={styles.conversionRateContainer}>
              <Text style={styles.conversionRateLabel}>Conversion Rate</Text>
              <View style={styles.conversionRateBar}>
                <View 
                  style={[
                    styles.conversionRateFill, 
                    { width: `${Math.min(((stats?.guest_conversions || 0) / (stats?.guest_signins || 1)) * 100, 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.conversionRateValue}>
                {(((stats?.guest_conversions || 0) / (stats?.guest_signins || 1)) * 100).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>

        {/* Content Moderation Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Content Moderation</Text>
            <View style={[styles.guestBadge, { backgroundColor: 'rgba(255, 87, 34, 0.15)' }]}>
              <Ionicons name="shield-checkmark" size={12} color='#FF5722' />
              <Text style={[styles.guestBadgeText, { color: '#FF5722' }]}>Safety</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>
            Reports, blocks, and content safety actions
          </Text>
          
          <View style={styles.moderationGrid}>
            <View style={styles.moderationCard}>
              <View style={[styles.moderationIcon, { backgroundColor: 'rgba(244, 67, 54, 0.15)' }]}>
                <Ionicons name="flag" size={20} color="#F44336" />
              </View>
              <Text style={styles.moderationValue}>0</Text>
              <Text style={styles.moderationLabel}>Pending Reports</Text>
              <View style={styles.moderationStatus}>
                <Ionicons name="checkmark-circle" size={14} color='#4CAF50' />
                <Text style={styles.moderationStatusText}>All clear</Text>
              </View>
            </View>
            
            <View style={styles.moderationCard}>
              <View style={[styles.moderationIcon, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
                <Ionicons name="alert-circle" size={20} color="#FF9800" />
              </View>
              <Text style={styles.moderationValue}>0</Text>
              <Text style={styles.moderationLabel}>Urgent (24h)</Text>
              <View style={styles.moderationStatus}>
                <Ionicons name="time-outline" size={14} color='#888' />
                <Text style={styles.moderationStatusText}>None due</Text>
              </View>
            </View>
            
            <View style={styles.moderationCard}>
              <View style={[styles.moderationIcon, { backgroundColor: 'rgba(156, 39, 176, 0.15)' }]}>
                <Ionicons name="ban" size={20} color="#9C27B0" />
              </View>
              <Text style={styles.moderationValue}>0</Text>
              <Text style={styles.moderationLabel}>User Blocks</Text>
              <View style={styles.moderationStatus}>
                <Ionicons name="shield-outline" size={14} color="#888" />
                <Text style={styles.moderationStatusText}>This week</Text>
              </View>
            </View>
          </View>

          {/* Moderation Actions Placeholder */}
          <View style={styles.moderationActions}>
            <TouchableOpacity 
              style={styles.moderationActionButton}
              onPress={() => router.push('/admin-featured-workouts')}
            >
              <Ionicons name="fitness-outline" size={18} color="#4A90D9" />
              <Text style={styles.moderationActionText}>Featured Workouts</Text>
              <Ionicons name="chevron-forward" size={14} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moderationActionButton}>
              <Ionicons name="list-outline" size={18} color="#FFD700" />
              <Text style={styles.moderationActionText}>View All Reports</Text>
              <View style={styles.moderationBadge}>
                <Text style={styles.moderationBadgeText}>0</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moderationActionButton}>
              <Ionicons name="people-outline" size={18} color="#FFD700" />
              <Text style={styles.moderationActionText}>Block Notifications</Text>
              <View style={styles.moderationBadge}>
                <Text style={styles.moderationBadgeText}>0</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.moderationNote}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.moderationNoteText}>
              Reports require action within 24 hours per App Store guidelines
            </Text>
          </View>
        </View>

        {/* Top Pages Visited */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Pages Visited</Text>
            <Text style={styles.totalBadge}>{stats?.total_screen_views?.toLocaleString() || 0} views</Text>
          </View>
          
          {stats?.top_pages && stats.top_pages.length > 0 ? (
            <View style={styles.listContainer}>
              {stats.top_pages.slice(0, 5).map((page, index) => {
                const maxViews = stats.top_pages[0]?.views || 1;
                const percentage = (page.views / maxViews) * 100;
                
                return (
                  <View key={page.page} style={styles.listItem}>
                    <View style={styles.listRank}>
                      <Text style={[styles.rankText, index === 0 && styles.rankTextGold]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.listContent}>
                      <Text style={styles.listTitle}>{formatPageName(page.page)}</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                      </View>
                    </View>
                    <View style={styles.listStats}>
                      <Text style={styles.listValue}>{page.views.toLocaleString()}</Text>
                      <Text style={styles.listSubValue}>{page.unique_users} users</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={32} color='#666' />
              <Text style={styles.emptyText}>No page view data yet</Text>
            </View>
          )}
        </View>

        {/* Mood Selection Distribution - Custom on-brand design */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mood Selection Distribution</Text>
            <Text style={styles.totalBadge}>{stats?.total_mood_selections?.toLocaleString() || 0} total</Text>
          </View>
          
          {moodChart && moodChart.labels.length > 0 ? (
            <View style={styles.moodDistributionContainer}>
              {/* Visual bars for each mood */}
              {stats?.top_mood_cards?.map((moodData, index) => {
                // Calculate percentage from stats total (ensures 100% total)
                const statsTotalMoods = stats?.total_mood_selections || 1;
                const percentage = (moodData.selections / statsTotalMoods) * 100;
                const moodId = moodData.mood_id || '';
                const color = MOOD_COLORS[moodId] || '#FFD700';
                const icon = MOOD_ICONS[moodId] || 'fitness';
                const displayName = MOOD_DISPLAY_NAMES[moodId] || moodData.mood;
                
                return (
                  <View key={moodId || index} style={styles.moodBarRow}>
                    <View style={styles.moodLabelContainer}>
                      <View style={[styles.moodIconCircle, { backgroundColor: `${color}30` }]}>
                        <Ionicons name={icon as any} size={16} color={color} />
                      </View>
                      <Text style={styles.moodLabel} numberOfLines={1}>{displayName}</Text>
                    </View>
                    <View style={styles.moodBarContainer}>
                      <View style={[styles.moodBar, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }]} />
                    </View>
                    <View style={styles.moodStats}>
                      <Text style={[styles.moodPercentage, { color }]}>{percentage.toFixed(1)}%</Text>
                      <Text style={styles.moodCount}>({moodData.selections})</Text>
                    </View>
                  </View>
                );
              })}
              {/* Total verification */}
              <View style={styles.moodTotalRow}>
                <Text style={styles.moodTotalText}>
                  Total: {stats?.total_mood_selections || 0} selections
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="happy-outline" size={32} color='#666' />
              <Text style={styles.emptyText}>No mood selection data yet</Text>
            </View>
          )}
        </View>

        {/* Charts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Growth Charts</Text>
            <View style={styles.chartPeriodSelector}>
              {['day', 'week', 'month'].map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chartPeriodBtn, chartPeriod === p && styles.chartPeriodBtnActive]}
                  onPress={() => setChartPeriod(p as 'day' | 'week' | 'month')}
                >
                  <Text style={[styles.chartPeriodText, chartPeriod === p && styles.chartPeriodTextActive]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* User Growth Chart */}
          {userGrowthChart && userGrowthChart.labels.length > 0 ? (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>New User Signups</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={{
                    labels: userGrowthChart.labels.slice(-8).map(label => {
                      // For weekly labels like 'Dec 30-Jan 5', show as '12/30'
                      if (chartPeriod === 'week' && label.includes('-')) {
                        const startPart = label.split('-')[0].trim();
                        const monthMatch = startPart.match(/([A-Z][a-z]+)\s*(\d+)/);
                        if (monthMatch) {
                          const monthNum = {
                            'Jan': '1', 'Feb': '2', 'Mar': '3', 'Apr': '4',
                            'May': '5', 'Jun': '6', 'Jul': '7', 'Aug': '8',
                            'Sep': '9', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                          }[monthMatch[1]] || monthMatch[1];
                          return `${monthNum}/${monthMatch[2]}`;
                        }
                      }
                      return label;
                    }),
                    datasets: [{ data: userGrowthChart.datasets[0]?.data.slice(-8) || [0] }]
                  }}
                  width={Math.max(screenWidth - 48, 8 * 55)}
                  height={200}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    ...chartConfig,
                    propsForLabels: {
                      fontSize: 10,
                    }
                  }}
                  style={styles.chart}
                  showValuesOnTopOfBars
                  fromZero
                />
              </ScrollView>
              {chartPeriod === 'week' && (
                <Text style={styles.chartSubtext}>Week starting dates (month/day)</Text>
              )}
            </View>
          ) : (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>New User Signups</Text>
              <View style={styles.noChartData}>
                <Ionicons name="bar-chart-outline" size={32} color='#666' />
                <Text style={styles.noChartText}>No signup data available</Text>
              </View>
            </View>
          )}
        </View>

        {/* Engagement Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Engagement Summary</Text>
            <Text style={styles.sectionHint}>Tap for chart</Text>
          </View>
          
          <View style={styles.engagementGrid}>
            <TouchableOpacity 
              style={styles.engagementCard}
              onPress={() => openEngagementChart('workouts_added', 'Workouts Added to Cart')}
            >
              <Ionicons name="cart" size={20} color="#9C27B0" />
              <Text style={styles.engagementValue}>{stats?.workouts_added || 0}</Text>
              <Text style={styles.engagementLabel}>Workouts Added</Text>
              <View style={styles.engagementChartHint}>
                <Ionicons name="bar-chart-outline" size={12} color='#666' />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.engagementCard}
              onPress={() => openEngagementChart('workouts_completed', 'Workouts Completed')}
            >
              <Ionicons name="fitness" size={20} color="#FFD700" />
              <Text style={styles.engagementValue}>{stats?.workouts_completed || 0}</Text>
              <Text style={styles.engagementLabel}>Workouts Completed</Text>
              {stats?.workout_completion_rate ? (
                <Text style={styles.engagementSub}>{stats.workout_completion_rate}%</Text>
              ) : null}
              <View style={styles.engagementChartHint}>
                <Ionicons name="bar-chart-outline" size={12} color='#666' />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.engagementCard}
              onPress={() => openEngagementChart('posts_created', 'Posts Created')}
            >
              <Ionicons name="create" size={20} color="#4CAF50" />
              <Text style={styles.engagementValue}>{stats?.posts_created || 0}</Text>
              <Text style={styles.engagementLabel}>Posts Created</Text>
              <View style={styles.engagementChartHint}>
                <Ionicons name="bar-chart-outline" size={12} color='#666' />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.engagementCard}
              onPress={() => openEngagementChart('likes', 'Likes')}
            >
              <Ionicons name="heart" size={20} color="#E91E63" />
              <Text style={styles.engagementValue}>{stats?.total_likes || 0}</Text>
              <Text style={styles.engagementLabel}>Likes</Text>
              <View style={styles.engagementChartHint}>
                <Ionicons name="bar-chart-outline" size={12} color='#666' />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.engagementCard}
              onPress={() => openEngagementChart('comments', 'Comments')}
            >
              <Ionicons name="chatbubble" size={20} color="#2196F3" />
              <Text style={styles.engagementValue}>{stats?.total_comments || 0}</Text>
              <Text style={styles.engagementLabel}>Comments</Text>
              <View style={styles.engagementChartHint}>
                <Ionicons name="bar-chart-outline" size={12} color='#666' />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Completions by Mood Widget */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Workout Completions by Mood</Text>
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => {
                setShowCompletionsByMoodModal(true);
                fetchCompletionsByMoodData(completionsByMoodPeriod);
              }}
            >
              <Text style={styles.expandButtonText}>View Chart</Text>
              <Ionicons name="expand-outline" size={14} color="#FFD700" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            Track which mood cards lead to completed workouts
          </Text>
          
          {/* Quick Stats Grid */}
          <View style={styles.moodCompletionsGrid}>
            {Object.entries(MOOD_DISPLAY_NAMES).map(([moodId, displayName]) => {
              const color = MOOD_COLORS[moodId] || '#FFD700';
              const icon = MOOD_ICONS[moodId] || 'fitness';
              const completions = stats?.top_mood_cards?.find(m => m.mood_id === moodId)?.selections || 0;
              
              return (
                <View key={moodId} style={styles.moodCompletionCard}>
                  <View style={[styles.moodCompletionIcon, { backgroundColor: `${color}20` }]}>
                    <Ionicons name={icon as any} size={18} color={color} />
                  </View>
                  <Text style={[styles.moodCompletionValue, { color }]}>{completions}</Text>
                  <Text style={styles.moodCompletionLabel} numberOfLines={1}>{displayName.split(' ')[0]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Build for Me Analytics Widget */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Build for Me Analytics</Text>
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => setShowBuildForMeModal(true)}
            >
              <Text style={styles.expandButtonText}>Details</Text>
              <Ionicons name="expand-outline" size={14} color="#FFD700" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            AI workout generation usage statistics
          </Text>
          
          {/* Quick Stats Row */}
          <View style={styles.buildForMeQuickStats}>
            <View style={styles.buildForMeStatCard}>
              <View style={[styles.buildForMeIcon, { backgroundColor: 'rgba(201, 164, 76, 0.2)' }]}>
                <Ionicons name="sparkles" size={20} color="#C9A44C" />
              </View>
              <Text style={styles.buildForMeStatValue}>{buildForMeStats?.total_generations || 0}</Text>
              <Text style={styles.buildForMeStatLabel}>Total Generations</Text>
            </View>
            
            <View style={styles.buildForMeStatCard}>
              <View style={[styles.buildForMeIcon, { backgroundColor: 'rgba(76, 201, 150, 0.2)' }]}>
                <Ionicons name="people" size={20} color="#4CC996" />
              </View>
              <Text style={styles.buildForMeStatValue}>{buildForMeStats?.unique_users || 0}</Text>
              <Text style={styles.buildForMeStatLabel}>Unique Users</Text>
            </View>
            
            <View style={styles.buildForMeStatCard}>
              <View style={[styles.buildForMeIcon, { backgroundColor: 'rgba(76, 175, 255, 0.2)' }]}>
                <Ionicons name="today" size={20} color="#4CAFFF" />
              </View>
              <Text style={styles.buildForMeStatValue}>{buildForMeStats?.today_generations || 0}</Text>
              <Text style={styles.buildForMeStatLabel}>Today</Text>
            </View>
            
            <View style={styles.buildForMeStatCard}>
              <View style={[styles.buildForMeIcon, { backgroundColor: 'rgba(255, 152, 76, 0.2)' }]}>
                <Ionicons name="trending-up" size={20} color="#FF984C" />
              </View>
              <Text style={styles.buildForMeStatValue}>{buildForMeStats?.avg_per_user || 0}</Text>
              <Text style={styles.buildForMeStatLabel}>Avg/User</Text>
            </View>
          </View>
          
          {/* By Mood Breakdown */}
          {buildForMeStats?.by_mood_card && buildForMeStats.by_mood_card.length > 0 && (
            <View style={styles.buildForMeMoodBreakdown}>
              <Text style={styles.buildForMeMoodTitle}>Generations by Mood</Text>
              {buildForMeStats.by_mood_card.slice(0, 5).map((item, index) => {
                const moodId = item.display_name.toLowerCase();
                const color = MOOD_COLORS[moodId] || '#FFD700';
                const icon = MOOD_ICONS[moodId] || 'fitness';
                const maxCount = buildForMeStats.by_mood_card[0]?.count || 1;
                const barWidth = (item.count / maxCount) * 100;
                
                return (
                  <View key={index} style={styles.buildForMeMoodRow}>
                    <View style={styles.buildForMeMoodInfo}>
                      <Ionicons name={icon as any} size={14} color={color} />
                      <Text style={styles.buildForMeMoodName}>{item.display_name}</Text>
                    </View>
                    <View style={styles.buildForMeMoodBarContainer}>
                      <View style={[styles.buildForMeMoodBar, { width: `${barWidth}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={styles.buildForMeMoodCount}>{item.count}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Custom Workouts Added to Cart Widget */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Custom Workouts Added</Text>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            Manually selected workouts (not AI-generated)
          </Text>
          
          {/* Quick Stats Row */}
          <View style={styles.customWorkoutsQuickStats}>
            <View style={styles.customWorkoutsStatCard}>
              <View style={[styles.customWorkoutsIcon, { backgroundColor: 'rgba(156, 39, 176, 0.2)' }]}>
                <Ionicons name="cart" size={20} color="#9C27B0" />
              </View>
              <Text style={styles.customWorkoutsStatValue}>{customWorkoutsStats?.total_custom_workouts || 0}</Text>
              <Text style={styles.customWorkoutsStatLabel}>Total Added</Text>
            </View>
            
            <View style={styles.customWorkoutsStatCard}>
              <View style={[styles.customWorkoutsIcon, { backgroundColor: 'rgba(33, 150, 243, 0.2)' }]}>
                <Ionicons name="people" size={20} color="#2196F3" />
              </View>
              <Text style={styles.customWorkoutsStatValue}>{customWorkoutsStats?.unique_users || 0}</Text>
              <Text style={styles.customWorkoutsStatLabel}>Unique Users</Text>
            </View>
          </View>
          
          {/* By Mood Breakdown */}
          {customWorkoutsStats?.by_mood_card && customWorkoutsStats.by_mood_card.length > 0 && (
            <View style={styles.buildForMeMoodBreakdown}>
              <Text style={styles.buildForMeMoodTitle}>By Mood Card</Text>
              {customWorkoutsStats.by_mood_card.slice(0, 5).map((item, index) => {
                const moodKey = item.mood?.toLowerCase().split('/')[0].trim() || 'unknown';
                const color = MOOD_COLORS[moodKey] || '#9C27B0';
                const icon = MOOD_ICONS[moodKey] || 'fitness';
                const maxCount = customWorkoutsStats.by_mood_card[0]?.count || 1;
                const barWidth = (item.count / maxCount) * 100;
                
                return (
                  <View key={index} style={styles.buildForMeMoodRow}>
                    <View style={styles.buildForMeMoodInfo}>
                      <Ionicons name={icon as any} size={14} color={color} />
                      <Text style={styles.buildForMeMoodName}>{item.mood?.split('/')[0].trim() || 'Unknown'}</Text>
                    </View>
                    <View style={styles.buildForMeMoodBarContainer}>
                      <View style={[styles.buildForMeMoodBar, { width: `${barWidth}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={styles.buildForMeMoodCount}>{item.count}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Try Workout Clicks Widget with Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Try This Workout (Explore)</Text>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            Users clicking "Try this workout" on completion cards in Explore feed
          </Text>
          
          {/* Quick Stats Row */}
          <View style={styles.customWorkoutsQuickStats}>
            <View style={styles.customWorkoutsStatCard}>
              <View style={[styles.customWorkoutsIcon, { backgroundColor: 'rgba(76, 175, 80, 0.2)' }]}>
                <Ionicons name="play-circle" size={20} color="#4CAF50" />
              </View>
              <Text style={styles.customWorkoutsStatValue}>{tryWorkoutStats?.total_clicks || 0}</Text>
              <Text style={styles.customWorkoutsStatLabel}>Total Clicks</Text>
            </View>
            
            <View style={styles.customWorkoutsStatCard}>
              <View style={[styles.customWorkoutsIcon, { backgroundColor: 'rgba(255, 87, 34, 0.2)' }]}>
                <Ionicons name="checkmark-done-circle" size={20} color="#FF5722" />
              </View>
              <Text style={styles.customWorkoutsStatValue}>{sessionCompletionStats?.total_completions || 0}</Text>
              <Text style={styles.customWorkoutsStatLabel}>Completions</Text>
            </View>
            
            <View style={styles.customWorkoutsStatCard}>
              <View style={[styles.customWorkoutsIcon, { backgroundColor: 'rgba(33, 150, 243, 0.2)' }]}>
                <Ionicons name="people" size={20} color="#2196F3" />
              </View>
              <Text style={styles.customWorkoutsStatValue}>{tryWorkoutStats?.unique_users || 0}</Text>
              <Text style={styles.customWorkoutsStatLabel}>Unique Users</Text>
            </View>
          </View>
          
          {/* Chart Period Selector */}
          <View style={styles.chartPeriodSelector}>
            <Text style={styles.chartPeriodLabel}>View by:</Text>
            {(['day', 'week', 'month'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.chartPeriodButton,
                  engagementChartPeriod === period && styles.chartPeriodButtonActive
                ]}
                onPress={() => setEngagementChartPeriod(period)}
              >
                <Text style={[
                  styles.chartPeriodButtonText,
                  engagementChartPeriod === period && styles.chartPeriodButtonTextActive
                ]}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Line Chart */}
          {workoutEngagementChart && workoutEngagementChart.data.length > 0 ? (
            <View style={styles.engagementChartContainer}>
              {/* Chart Legend */}
              <View style={styles.chartLegend}>
                <View style={styles.chartLegendItem}>
                  <View style={[styles.chartLegendDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.chartLegendText}>Clicks</Text>
                </View>
                <View style={styles.chartLegendItem}>
                  <View style={[styles.chartLegendDot, { backgroundColor: '#FF5722' }]} />
                  <Text style={styles.chartLegendText}>Completions</Text>
                </View>
                <View style={styles.chartLegendItem}>
                  <View style={[styles.chartLegendDot, { backgroundColor: '#2196F3' }]} />
                  <Text style={styles.chartLegendText}>Unique Users</Text>
                </View>
              </View>
              
              {/* Simple Bar Chart Visualization */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScrollView}>
                <View style={styles.chartBarsContainer}>
                  {workoutEngagementChart.data.map((item, index) => {
                    const maxValue = Math.max(
                      ...workoutEngagementChart.data.map(d => Math.max(d.try_clicks, d.completions, d.try_unique_users))
                    ) || 1;
                    return (
                      <View key={index} style={styles.chartBarGroup}>
                        <View style={styles.chartBarsRow}>
                          <View 
                            style={[
                              styles.chartBar, 
                              { 
                                height: Math.max(4, (item.try_clicks / maxValue) * 80),
                                backgroundColor: '#4CAF50' 
                              }
                            ]} 
                          />
                          <View 
                            style={[
                              styles.chartBar, 
                              { 
                                height: Math.max(4, (item.completions / maxValue) * 80),
                                backgroundColor: '#FF5722' 
                              }
                            ]} 
                          />
                          <View 
                            style={[
                              styles.chartBar, 
                              { 
                                height: Math.max(4, (item.try_unique_users / maxValue) * 80),
                                backgroundColor: '#2196F3' 
                              }
                            ]} 
                          />
                        </View>
                        <Text style={styles.chartBarLabel} numberOfLines={1}>
                          {engagementChartPeriod === 'day' 
                            ? item.date.slice(5) // Show MM-DD
                            : engagementChartPeriod === 'week'
                            ? item.date.slice(5) // Show W##
                            : item.date.slice(2) // Show YY-MM
                          }
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          ) : (
            <View style={styles.noChartData}>
              <Ionicons name="bar-chart-outline" size={40} color="rgba(255, 255, 255, 0.3)" />
              <Text style={styles.noChartDataText}>No chart data available yet</Text>
            </View>
          )}
        </View>

        {/* Workout Session Completions Widget */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Workout Session Completions</Text>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            Users who completed a full workout session
          </Text>
          
          {/* Quick Stats Row */}
          <View style={styles.customWorkoutsQuickStats}>
            <View style={styles.customWorkoutsStatCard}>
              <View style={[styles.customWorkoutsIcon, { backgroundColor: 'rgba(255, 87, 34, 0.2)' }]}>
                <Ionicons name="checkmark-done-circle" size={20} color="#FF5722" />
              </View>
              <Text style={styles.customWorkoutsStatValue}>{sessionCompletionStats?.total_completions || 0}</Text>
              <Text style={styles.customWorkoutsStatLabel}>Total Done</Text>
            </View>
            
            <View style={styles.customWorkoutsStatCard}>
              <View style={[styles.customWorkoutsIcon, { backgroundColor: 'rgba(0, 188, 212, 0.2)' }]}>
                <Ionicons name="people" size={20} color="#00BCD4" />
              </View>
              <Text style={styles.customWorkoutsStatValue}>{sessionCompletionStats?.unique_users || 0}</Text>
              <Text style={styles.customWorkoutsStatLabel}>Unique Users</Text>
            </View>
            
            <View style={styles.customWorkoutsStatCard}>
              <View style={[styles.customWorkoutsIcon, { backgroundColor: 'rgba(139, 195, 74, 0.2)' }]}>
                <Ionicons name="today" size={20} color="#8BC34A" />
              </View>
              <Text style={styles.customWorkoutsStatValue}>{sessionCompletionStats?.today_completions || 0}</Text>
              <Text style={styles.customWorkoutsStatLabel}>Today</Text>
            </View>
            
            <View style={styles.customWorkoutsStatCard}>
              <View style={[styles.customWorkoutsIcon, { backgroundColor: 'rgba(103, 58, 183, 0.2)' }]}>
                <Ionicons name="time" size={20} color="#673AB7" />
              </View>
              <Text style={styles.customWorkoutsStatValue}>
                {sessionCompletionStats?.avg_duration_seconds 
                  ? Math.round(sessionCompletionStats.avg_duration_seconds / 60) + 'm'
                  : '0m'
                }
              </Text>
              <Text style={styles.customWorkoutsStatLabel}>Avg Duration</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Data generated at {new Date().toLocaleString('en-US', {
              timeZone: 'America/Chicago',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })} CT
          </Text>
          <Text style={styles.footerText}>
            Active user tracking: 5-minute heartbeat interval
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Active Users Modal */}
      <Modal
        visible={showActiveUsers}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowActiveUsers(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowActiveUsers(false)} style={styles.modalClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <View style={styles.liveIndicator}>
                <View style={styles.livePulse} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <Text style={styles.modalTitle}>Active Users</Text>
            </View>
            <Text style={styles.modalCount}>{realtimeActiveCount} online</Text>
          </View>

          <Text style={styles.activeUsersSubtitle}>
            Users with app open in the last 5 minutes
          </Text>

          {activeUsers.length > 0 ? (
            <FlatList
              data={activeUsers}
              keyExtractor={(item) => item.user_id}
              renderItem={({ item }) => (
                <View style={styles.activeUserItem}>
                  <View style={styles.activeUserAvatar}>
                    {getAvatarUri(item.avatar_url, item.avatar) ? (
                      <Image 
                        source={{ uri: getAvatarUri(item.avatar_url, item.avatar)! }} 
                        style={styles.avatarImage} 
                      />
                    ) : (
                      <Ionicons name="person" size={24} color='#666' />
                    )}
                    <View style={styles.onlineDot} />
                  </View>
                  <View style={styles.activeUserInfo}>
                    <Text style={styles.activeUserName}>{item.username}</Text>
                    <Text style={styles.activeUserTime}>
                      Last active: {item.last_active ? new Date(item.last_active).toLocaleTimeString('en-US', {
                        timeZone: 'America/Chicago',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }) + ' CT' : 'Just now'}
                    </Text>
                  </View>
                </View>
              )}
            />
          ) : (
            <View style={styles.emptyActiveUsers}>
              <Ionicons name="people-outline" size={48} color="#666" />
              <Text style={styles.emptyActiveText}>No users currently online</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Session Chart Modal */}
      <Modal
        visible={showSessionChart}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSessionChart(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSessionChart(false)} style={styles.modalClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>App Sessions by Day</Text>
            <View style={{ width: 24 }} />
          </View>

          <Text style={styles.sessionChartSubtitle}>
            Daily app session activity (last 30 days)
          </Text>

          {sessionChart && sessionChart.labels.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sessionChartContainer}
            >
              <LineChart
                data={{
                  labels: sessionChart.labels,
                  datasets: [{ data: sessionChart.datasets[0]?.data || [0] }]
                }}
                width={Math.max(screenWidth - 32, sessionChart.labels.length * 40)}
                height={280}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                }}
                bezier
                style={styles.sessionLineChart}
                fromZero
              />
            </ScrollView>
          ) : (
            <View style={styles.noSessionData}>
              <Ionicons name="analytics-outline" size={48} color="#666" />
              <Text style={styles.noSessionText}>No session data available</Text>
            </View>
          )}

          <View style={styles.sessionSummary}>
            <View style={styles.sessionSummaryItem}>
              <Text style={styles.sessionSummaryValue}>{stats?.total_sessions?.toLocaleString() || 0}</Text>
              <Text style={styles.sessionSummaryLabel}>Total Sessions</Text>
            </View>
            <View style={styles.sessionSummaryDivider} />
            <View style={styles.sessionSummaryItem}>
              <Text style={styles.sessionSummaryValue}>
                {sessionChart?.datasets[0]?.data.length 
                  ? Math.round(sessionChart.datasets[0].data.reduce((a, b) => a + b, 0) / sessionChart.datasets[0].data.length)
                  : 0}
              </Text>
              <Text style={styles.sessionSummaryLabel}>Avg Daily</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Engagement Chart Modal */}
      <Modal
        visible={showEngagementChart}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEngagementChart(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEngagementChart(false)} style={styles.modalClose}>
              <Ionicons name="close" size={24} color='#fff' />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{engagementChartTitle}</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Period Selector */}
          <View style={styles.engagementChartPeriodSelector}>
            {(['day', 'week', 'month'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.engagementChartPeriodBtn,
                  engagementChartPeriod === period && styles.engagementChartPeriodBtnActive
                ]}
                onPress={() => setEngagementChartPeriod(period)}
              >
                <Text style={[
                  styles.engagementChartPeriodText,
                  engagementChartPeriod === period && styles.engagementChartPeriodTextActive
                ]}>
                  {period === 'day' ? 'Daily' : period === 'week' ? 'Weekly' : 'Monthly'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {engagementChartLoading ? (
            <View style={styles.engagementChartLoading}>
              <ActivityIndicator size="large" color='#FFD700' />
              <Text style={styles.engagementChartLoadingText}>Loading chart...</Text>
            </View>
          ) : engagementChartData && engagementChartData.labels.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.engagementChartScrollContainer}
            >
              <BarChart
                data={{
                  labels: engagementChartData.labels.slice(-12).map(label => {
                    // Format labels for readability
                    if (engagementChartPeriod === 'week' && label.includes('-')) {
                      const startPart = label.split('-')[0].trim();
                      const monthMatch = startPart.match(/([A-Z][a-z]+)\s*(\d+)/);
                      if (monthMatch) {
                        const monthNum: Record<string, string> = {
                          'Jan': '1', 'Feb': '2', 'Mar': '3', 'Apr': '4',
                          'May': '5', 'Jun': '6', 'Jul': '7', 'Aug': '8',
                          'Sep': '9', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                        };
                        return `${monthNum[monthMatch[1]] || monthMatch[1]}/${monthMatch[2]}`;
                      }
                    }
                    return label;
                  }),
                  datasets: [{ data: engagementChartData.datasets[0]?.data.slice(-12) || [0] }]
                }}
                width={Math.max(screenWidth - 48, 12 * 50)}
                height={280}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#1a1a1a',
                  backgroundGradientFrom: '#1a1a1a',
                  backgroundGradientTo: '#1a1a1a',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForLabels: { fontSize: 10 },
                  barPercentage: 0.7,
                }}
                style={styles.engagementBarChart}
                showValuesOnTopOfBars
                fromZero
              />
            </ScrollView>
          ) : (
            <View style={styles.noEngagementData}>
              <Ionicons name="bar-chart-outline" size={48} color='#666' />
              <Text style={styles.noEngagementText}>No data available for this period</Text>
            </View>
          )}

          {/* Summary */}
          {engagementChartData && engagementChartData.datasets[0]?.data.length > 0 && (
            <View style={styles.engagementChartSummary}>
              <View style={styles.engagementChartSummaryItem}>
                <Text style={styles.engagementChartSummaryValue}>
                  {engagementChartData.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString()}
                </Text>
                <Text style={styles.engagementChartSummaryLabel}>Total</Text>
              </View>
              <View style={styles.engagementChartSummaryDivider} />
              <View style={styles.engagementChartSummaryItem}>
                <Text style={styles.engagementChartSummaryValue}>
                  {Math.round(engagementChartData.datasets[0].data.reduce((a, b) => a + b, 0) / engagementChartData.datasets[0].data.length)}
                </Text>
                <Text style={styles.engagementChartSummaryLabel}>
                  Avg per {engagementChartPeriod === 'day' ? 'Day' : engagementChartPeriod === 'week' ? 'Week' : 'Month'}
                </Text>
              </View>
              <View style={styles.engagementChartSummaryDivider} />
              <View style={styles.engagementChartSummaryItem}>
                <Text style={styles.engagementChartSummaryValue}>
                  {Math.max(...engagementChartData.datasets[0].data)}
                </Text>
                <Text style={styles.engagementChartSummaryLabel}>Peak</Text>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Completions by Mood Chart Modal */}
      <Modal
        visible={showCompletionsByMoodModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCompletionsByMoodModal(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCompletionsByMoodModal(false)} style={styles.modalClose}>
              <Ionicons name="close" size={24} color='#fff' />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Completions by Mood</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Period Selector */}
          <View style={styles.engagementChartPeriodSelector}>
            {(['day', 'week', 'month'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.engagementChartPeriodBtn,
                  completionsByMoodPeriod === period && styles.engagementChartPeriodBtnActive
                ]}
                onPress={() => setCompletionsByMoodPeriod(period)}
              >
                <Text style={[
                  styles.engagementChartPeriodText,
                  completionsByMoodPeriod === period && styles.engagementChartPeriodTextActive
                ]}>
                  {period === 'day' ? 'Daily' : period === 'week' ? 'Weekly' : 'Monthly'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {completionsByMoodLoading ? (
            <View style={styles.engagementChartLoading}>
              <ActivityIndicator size="large" color='#FFD700' />
              <Text style={styles.engagementChartLoadingText}>Loading chart...</Text>
            </View>
          ) : completionsByMoodData && completionsByMoodData.labels.length > 0 ? (
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {/* Legend */}
              <View style={styles.moodChartLegend}>
                {completionsByMoodData.datasets.map((dataset, index) => {
                  const moodId = (dataset as any).mood_id || '';
                  const color = MOOD_COLORS[moodId] || '#FFD700';
                  return (
                    <View key={index} style={styles.moodLegendItem}>
                      <View style={[styles.moodLegendColor, { backgroundColor: color }]} />
                      <Text style={styles.moodLegendText}>{dataset.label}</Text>
                    </View>
                  );
                })}
              </View>
              
              {/* Stacked Bar Chart - one bar per mood */}
              {completionsByMoodData.datasets.map((dataset, index) => {
                const moodId = (dataset as any).mood_id || '';
                const color = MOOD_COLORS[moodId] || '#FFD700';
                const total = dataset.data.reduce((a, b) => a + b, 0);
                
                return (
                  <View key={index} style={styles.moodChartRow}>
                    <View style={styles.moodChartLabel}>
                      <View style={[styles.moodChartIcon, { backgroundColor: `${color}30` }]}>
                        <Ionicons name={MOOD_ICONS[moodId] as any || 'fitness'} size={16} color={color} />
                      </View>
                      <Text style={styles.moodChartLabelText}>{dataset.label}</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodChartBarsContainer}>
                      <BarChart
                        data={{
                          labels: completionsByMoodData.labels.slice(-12),
                          datasets: [{ data: dataset.data.slice(-12).map(v => v || 0) }]
                        }}
                        width={Math.max(screenWidth - 150, 12 * 40)}
                        height={80}
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={{
                          backgroundColor: 'transparent',
                          backgroundGradientFrom: '#1a1a1a',
                          backgroundGradientTo: '#1a1a1a',
                          decimalPlaces: 0,
                          color: () => color,
                          labelColor: () => '#888',
                          barPercentage: 0.6,
                          propsForLabels: { fontSize: 8 },
                        }}
                        style={{ marginLeft: -20 }}
                        showValuesOnTopOfBars
                        fromZero
                        withHorizontalLabels={false}
                      />
                    </ScrollView>
                    <Text style={[styles.moodChartTotal, { color }]}>{total}</Text>
                  </View>
                );
              })}
              
              {/* Summary */}
              <View style={styles.engagementChartSummary}>
                <View style={styles.engagementChartSummaryItem}>
                  <Text style={styles.engagementChartSummaryValue}>
                    {completionsByMoodData.datasets.reduce((sum, ds) => sum + ds.data.reduce((a, b) => a + b, 0), 0)}
                  </Text>
                  <Text style={styles.engagementChartSummaryLabel}>Total Completions</Text>
                </View>
                <View style={styles.engagementChartSummaryDivider} />
                <View style={styles.engagementChartSummaryItem}>
                  <Text style={styles.engagementChartSummaryValue}>
                    {completionsByMoodData.datasets.length}
                  </Text>
                  <Text style={styles.engagementChartSummaryLabel}>Active Moods</Text>
                </View>
              </View>
              
              <View style={{ height: 40 }} />
            </ScrollView>
          ) : (
            <View style={styles.noEngagementData}>
              <Ionicons name="bar-chart-outline" size={48} color='#666' />
              <Text style={styles.noEngagementText}>No completion data available</Text>
              <Text style={styles.noEngagementSubtext}>Complete some workouts to see data here</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* User List Modal */}
      <Modal
        visible={showUserList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUserList(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowUserList(false)} style={styles.modalClose}>
              <Ionicons name="close" size={24} color='#fff' />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {userListType === 'all' ? 'All Users' : userListType === 'new' ? 'New Users' : 'Active Users'}
            </Text>
            <Text style={styles.modalCount}>{totalUsersCount} total</Text>
          </View>

          {userListType === 'all' && (
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username or email..."
                placeholderTextColor='#666'
                value={userSearchQuery}
                onChangeText={(text) => {
                  setUserSearchQuery(text);
                  setTimeout(() => fetchUsers('all', text), 300);
                }}
              />
            </View>
          )}

          {usersLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#FFD700" />
            </View>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => item.user_id}
              renderItem={({ item, index }) => (
                <TouchableOpacity 
                  style={styles.userItem}
                  onPress={() => fetchUserReport(item.user_id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.userRank}>
                    <Text style={styles.userRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.userAvatar}>
                    {getAvatarUri(item.avatar_url, item.avatar) ? (
                      <Image 
                        source={{ uri: getAvatarUri(item.avatar_url, item.avatar)! }} 
                        style={styles.avatarImage} 
                      />
                    ) : (
                      <Ionicons name="person" size={20} color="#666" />
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.username}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    <Text style={styles.userSignupDate}>
                      📅 Signed up: {formatDateToCST(item.created_at)}
                    </Text>
                    <View style={styles.userStatsRow}>
                      <Text style={styles.userStat}>
                        <Ionicons name="fitness" size={12} color="#FFD700" /> {item.workouts_completed || 0}
                      </Text>
                      <Text style={styles.userStat}>
                        <Ionicons name="create" size={12} color="#4CAF50" /> {item.posts_created || 0}
                      </Text>
                      <Text style={styles.userStat}>
                        <Ionicons name="people" size={12} color="#2196F3" /> {item.followers_count || 0}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.userActions}>
                    <TouchableOpacity 
                      style={styles.viewReportBtn}
                      onPress={() => fetchUserReport(item.user_id)}
                    >
                      <Ionicons name="analytics-outline" size={18} color="#FFD700" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteUserBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        deleteUser(item.user_id, item.username);
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>No users found</Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>

      {/* User Report Modal */}
      <Modal
        visible={showUserReport}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUserReport(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowUserReport(false)} style={styles.modalClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>User Report</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Time Period Selector for User Report */}
          <View style={styles.reportPeriodSelector}>
            {TIME_PERIODS.map(period => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.reportPeriodChip,
                  userReportPeriod === period.value && styles.reportPeriodChipActive
                ]}
                onPress={() => handleReportPeriodChange(period.value)}
              >
                <Text style={[
                  styles.reportPeriodChipText,
                  userReportPeriod === period.value && styles.reportPeriodChipTextActive
                ]}>
                  {period.shortLabel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {userReportLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Loading report...</Text>
            </View>
          ) : userReport ? (
            <ScrollView style={styles.reportScrollView} showsVerticalScrollIndicator={false}>
              {/* User Header */}
              <View style={styles.reportUserHeader}>
                <View style={styles.reportAvatar}>
                  {getAvatarUri(userReport.user.avatar_url, userReport.user.avatar) ? (
                    <Image 
                      source={{ uri: getAvatarUri(userReport.user.avatar_url, userReport.user.avatar)! }} 
                      style={styles.reportAvatarImage} 
                    />
                  ) : (
                    <Ionicons name="person" size={40} color="#666" />
                  )}
                </View>
                <View style={styles.reportUserInfo}>
                  <Text style={styles.reportUsername}>{userReport.user.username}</Text>
                  <Text style={styles.reportEmail}>{userReport.user.email}</Text>
                  <Text style={styles.reportSignupDate}>
                    Joined: {formatDateToCST(userReport.user.created_at)}
                  </Text>
                </View>
              </View>

              {/* Workout Metrics */}
              <View style={styles.reportSection}>
                <Text style={styles.reportSectionTitle}>
                  <Ionicons name="fitness" size={16} color='#FFD700' /> Workout Activity
                </Text>
                <View style={styles.reportMetricsGrid}>
                  <View style={styles.reportMetricItem}>
                    <Text style={styles.reportMetricValue}>{userReport.report.workouts_added_to_cart}</Text>
                    <Text style={styles.reportMetricLabel}>Added to Cart</Text>
                  </View>
                  <View style={styles.reportMetricItem}>
                    <Text style={styles.reportMetricValue}>{userReport.report.workouts_started}</Text>
                    <Text style={styles.reportMetricLabel}>Started</Text>
                  </View>
                  <View style={styles.reportMetricItem}>
                    <Text style={styles.reportMetricValue}>{userReport.report.workouts_completed}</Text>
                    <Text style={styles.reportMetricLabel}>Completed</Text>
                  </View>
                  <View style={styles.reportMetricItem}>
                    <Text style={[styles.reportMetricValue, { color: '#4CAF50' }]}>
                      {userReport.report.workout_completion_rate}%
                    </Text>
                    <Text style={styles.reportMetricLabel}>Completion</Text>
                  </View>
                </View>
              </View>

              {/* App Usage Metrics */}
              <View style={styles.reportSection}>
                <Text style={styles.reportSectionTitle}>
                  <Ionicons name="phone-portrait" size={16} color='#2196F3' /> App Usage
                </Text>
                <View style={styles.reportMetricsGrid}>
                  <View style={styles.reportMetricItem}>
                    <Text style={styles.reportMetricValue}>{userReport.report.app_sessions}</Text>
                    <Text style={styles.reportMetricLabel}>App Sessions</Text>
                  </View>
                  <View style={styles.reportMetricItem}>
                    <Text style={styles.reportMetricValue}>{userReport.report.total_screen_views}</Text>
                    <Text style={styles.reportMetricLabel}>Screens Viewed</Text>
                  </View>
                  <View style={styles.reportMetricItem}>
                    <Text style={styles.reportMetricValue}>{userReport.report.unique_screens_viewed}</Text>
                    <Text style={styles.reportMetricLabel}>Unique Screens</Text>
                  </View>
                  <View style={styles.reportMetricItem}>
                    <Text style={[styles.reportMetricValue, { color: '#FFD700' }]}>
                      {userReport.report.time_spent_formatted}
                    </Text>
                    <Text style={styles.reportMetricLabel}>Time in App</Text>
                  </View>
                </View>
              </View>

              {/* Top Screens - matching aggregate dashboard format */}
              {userReport.report.top_screens.length > 0 && (
                <View style={styles.reportSection}>
                  <View style={styles.reportSectionHeader}>
                    <Text style={styles.reportSectionTitle}>
                      <Ionicons name="layers" size={16} color='#9C27B0' /> Top Screens
                    </Text>
                    <Text style={styles.reportTotalBadge}>{userReport.report.total_screen_views} views</Text>
                  </View>
                  <View style={styles.listContainer}>
                    {userReport.report.top_screens.map((screen, idx) => {
                      const maxViews = userReport.report.top_screens[0]?.views || 1;
                      const percentage = (screen.views / maxViews) * 100;
                      
                      return (
                        <View key={screen.screen} style={styles.listItem}>
                          <View style={styles.listRank}>
                            <Text style={[styles.rankText, idx === 0 && styles.rankTextGold]}>
                              {idx + 1}
                            </Text>
                          </View>
                          <View style={styles.listContent}>
                            <Text style={styles.listTitle}>{screen.screen}</Text>
                            <View style={styles.progressBar}>
                              <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: '#9C27B0' }]} />
                            </View>
                          </View>
                          <View style={styles.listStats}>
                            <Text style={styles.listValue}>{screen.views}</Text>
                            <Text style={styles.listSubValue}>{screen.percentage || Math.round(percentage)}%</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Social/Engagement Metrics */}
              <View style={styles.reportSection}>
                <Text style={styles.reportSectionTitle}>
                  <Ionicons name="heart" size={16} color="#E91E63" /> Social Engagement
                </Text>
                <View style={styles.reportMetricsGrid}>
                  <View style={styles.reportMetricItem}>
                    <Text style={styles.reportMetricValue}>{userReport.report.posts_created}</Text>
                    <Text style={styles.reportMetricLabel}>Posts</Text>
                  </View>
                  <View style={styles.reportMetricItem}>
                    <Text style={styles.reportMetricValue}>{userReport.report.likes_given}</Text>
                    <Text style={styles.reportMetricLabel}>Likes Given</Text>
                  </View>
                  <View style={styles.reportMetricItem}>
                    <Text style={styles.reportMetricValue}>{userReport.report.comments_made}</Text>
                    <Text style={styles.reportMetricLabel}>Comments</Text>
                  </View>
                  <View style={styles.reportMetricItem}>
                    <Text style={styles.reportMetricValue}>{userReport.report.follows_given}</Text>
                    <Text style={styles.reportMetricLabel}>Follows</Text>
                  </View>
                </View>
              </View>

              {/* Other Metrics */}
              <View style={styles.reportSection}>
                <Text style={styles.reportSectionTitle}>
                  <Ionicons name="analytics" size={16} color="#FF9800" /> Other Activity
                </Text>
                <View style={styles.reportMetricsGrid}>
                  <View style={styles.reportMetricItem}>
                    <Text style={styles.reportMetricValue}>{userReport.report.mood_selections}</Text>
                    <Text style={styles.reportMetricLabel}>Mood Selections</Text>
                  </View>
                  <View style={styles.reportMetricItem}>
                    <Text style={styles.reportMetricValue}>{userReport.user.followers_count}</Text>
                    <Text style={styles.reportMetricLabel}>Followers</Text>
                  </View>
                  <View style={styles.reportMetricItem}>
                    <Text style={styles.reportMetricValue}>{userReport.user.following_count}</Text>
                    <Text style={styles.reportMetricLabel}>Following</Text>
                  </View>
                </View>
              </View>

              {/* Last Active */}
              {userReport.report.last_active && (
                <View style={styles.reportLastActive}>
                  <Ionicons name="time-outline" size={14} color='#888' />
                  <Text style={styles.reportLastActiveText}>
                    Last active: {formatDateToCST(userReport.report.last_active)}
                  </Text>
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      {/* Deleted Users Modal */}
      <Modal
        visible={showDeletedUsers}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDeletedUsers(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDeletedUsers(false)} style={styles.modalClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Ionicons name="person-remove" size={20} color="#FF5722" style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Churned Users</Text>
            </View>
            <Text style={[styles.modalCount, { color: '#FF5722' }]}>{deletedUsersCount} total</Text>
          </View>

          <Text style={styles.activeUsersSubtitle}>
            Users who deleted their accounts in the selected period
          </Text>

          {deletedUsers.length > 0 ? (
            <FlatList
              data={deletedUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.deletedUserItem}>
                  <View style={styles.deletedUserAvatar}>
                    <Ionicons name="person-outline" size={24} color='#666' />
                  </View>
                  <View style={styles.deletedUserInfo}>
                    <Text style={styles.deletedUserName}>{item.username}</Text>
                    <Text style={styles.deletedUserEmail}>{item.email}</Text>
                    <View style={styles.deletedUserStats}>
                      <Text style={styles.deletedUserStat}>
                        {item.workouts_completed} workouts
                      </Text>
                      <Text style={styles.deletedUserStat}>
                        {item.posts_count} posts
                      </Text>
                      <Text style={styles.deletedUserStat}>
                        {item.followers_count} followers
                      </Text>
                    </View>
                    <Text style={styles.deletedUserDate}>
                      Deleted: {item.deleted_at ? new Date(item.deleted_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Unknown'}
                    </Text>
                  </View>
                </View>
              )}
            />
          ) : (
            <View style={styles.emptyDeletedUsers}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#4CAF50" />
              <Text style={styles.emptyDeletedText}>No churned users in this period</Text>
              <Text style={styles.emptyDeletedSubtext}>All users are retained!</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

// Helper functions
function formatPageName(pageName: string): string {
  const nameMap: Record<string, string> = {
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
  return nameMap[pageName] || pageName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 14,
  },
  // Debug Panel Styles
  debugPanel: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#4a90d9',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  debugTitle: {
    color: '#4a90d9',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  debugText: {
    fontSize: 11,
    marginBottom: 2,
  },
  debugLabel: {
    color: '#888',
    fontWeight: '600',
  },
  debugValue: {
    color: '#4a90d9',
    fontFamily: 'monospace',
  },
  debugWarning: {
    color: '#ff6b6b',
    fontWeight: '700',
  },
  debugSuccess: {
    color: '#4ecdc4',
    fontWeight: '700',
  },
  debugDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 6,
  },
  quickActionsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
    gap: 10,
  },
  quickActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  exportButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0c0c0c',
  },
  addWorkoutCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  addWorkoutCtaText: {
    flex: 1,
    color: '#0c0c0c',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 50,
    alignItems: 'center',
  },
  periodChipActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  periodChipText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  // User Type Filter Styles
  userTypeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#0c0c0c',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  userTypeLabel: {
    fontSize: 12,
    color: '#666',
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  userTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  userTypeChipActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  userTypeChipText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  userTypeChipTextActive: {
    color: '#000',
  },
  periodChipTextActive: {
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    marginBottom: 12,
  },
  totalBadge: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: (screenWidth - 44) / 2,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  metricLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  metricFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  metricHint: {
    fontSize: 10,
    color: '#666',
  },
  metricSubValue: {
    fontSize: 11,
    color: '#666',
  },
  liveDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F44336',
  },
  listContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  listRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
  },
  rankTextGold: {
    color: '#FFD700',
  },
  listContent: {
    flex: 1,
    marginRight: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
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
  listStats: {
    alignItems: 'flex-end',
  },
  listValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  listSubValue: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  // Mood Distribution styles (on-brand)
  moodDistributionContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  moodBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 140,
  },
  moodIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  moodLabel: {
    fontSize: 12,
    color: '#fff',
    flex: 1,
  },
  moodBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  moodBar: {
    height: '100%',
    borderRadius: 4,
  },
  moodStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
    justifyContent: 'flex-end',
  },
  moodPercentage: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  moodCount: {
    fontSize: 10,
    color: '#666',
  },
  moodTotalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    alignItems: 'center',
  },
  moodTotalText: {
    fontSize: 11,
    color: '#888',
  },
  // Guest Activity Styles
  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(156, 39, 176, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  guestBadgeText: {
    fontSize: 10,
    color: '#9C27B0',
    fontWeight: '600',
  },
  guestMetricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  guestMetricCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  guestMetricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  guestMetricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  guestMetricLabel: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
  conversionRateContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  conversionRateLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  conversionRateBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  conversionRateFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  conversionRateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
    textAlign: 'right',
  },
  chartPeriodSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  chartPeriodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
  },
  chartPeriodBtnActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  chartPeriodText: {
    fontSize: 11,
    color: '#888',
  },
  chartPeriodTextActive: {
    color: '#FFD700',
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  chartSubtext: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  chart: {
    borderRadius: 8,
  },
  noChartData: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noChartText: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  engagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  engagementCard: {
    width: (screenWidth - 44) / 2,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
    position: 'relative',
  },
  engagementValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  engagementLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  engagementSub: {
    fontSize: 10,
    color: '#4CAF50',
    marginTop: 4,
  },
  engagementChartHint: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  sectionHint: {
    fontSize: 10,
    color: '#666',
  },
  // Engagement Chart Modal Styles
  engagementChartPeriodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.1)',
  },
  engagementChartPeriodBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  engagementChartPeriodBtnActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  engagementChartPeriodText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  engagementChartPeriodTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  engagementChartLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  engagementChartLoadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 14,
  },
  engagementChartScrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  engagementBarChart: {
    borderRadius: 12,
  },
  noEngagementData: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noEngagementText: {
    color: '#666',
    marginTop: 12,
    fontSize: 14,
  },
  engagementChartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.1)',
  },
  engagementChartSummaryItem: {
    alignItems: 'center',
  },
  engagementChartSummaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
  },
  engagementChartSummaryLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  engagementChartSummaryDivider: {
    width: 1,
    backgroundColor: '#333',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.1)',
  },
  modalClose: {
    padding: 4,
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  modalCount: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  // Active users modal styles
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F44336',
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F44336',
  },
  activeUsersSubtitle: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 12,
  },
  activeUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  activeUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  activeUserInfo: {
    flex: 1,
  },
  activeUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  activeUserTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  emptyActiveUsers: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyActiveText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  // Deleted users modal styles
  deletedUserItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  deletedUserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deletedUserInfo: {
    flex: 1,
  },
  deletedUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deletedUserEmail: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  deletedUserStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  deletedUserStat: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deletedUserDate: {
    fontSize: 11,
    color: '#FF5722',
    marginTop: 8,
  },
  emptyDeletedUsers: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDeletedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 16,
  },
  emptyDeletedSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  // Session chart modal styles
  sessionChartSubtitle: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 12,
  },
  sessionChartContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sessionLineChart: {
    borderRadius: 12,
  },
  noSessionData: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSessionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  sessionSummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  sessionSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  sessionSummaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFD700',
  },
  sessionSummaryLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  sessionSummaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#333',
    marginHorizontal: 20,
  },
  // User list styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: '#fff',
    fontSize: 14,
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  userRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userRankText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  userEmail: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  userSignupDate: {
    fontSize: 10,
    color: '#FFD700',
    marginTop: 4,
  },
  userStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  userStat: {
    fontSize: 10,
    color: '#666',
  },
  userActions: {
    flexDirection: 'column',
    gap: 8,
  },
  viewReportBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
  },
  deleteUserBtn: {
    padding: 6,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyListText: {
    color: '#666',
    fontSize: 14,
  },
  // User Report Modal Styles
  reportPeriodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0c0c0c',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.1)',
  },
  reportPeriodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 40,
    alignItems: 'center',
  },
  reportPeriodChipActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  reportPeriodChipText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  reportPeriodChipTextActive: {
    color: '#000',
  },
  reportScrollView: {
    flex: 1,
  },
  reportUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  reportAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  reportAvatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  reportUserInfo: {
    flex: 1,
  },
  reportUsername: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  reportEmail: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  reportSignupDate: {
    fontSize: 11,
    color: '#FFD700',
    marginTop: 6,
  },
  reportPeriodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 20,
  },
  reportPeriodText: {
    fontSize: 12,
    color: '#FFD700',
  },
  reportSection: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  reportSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  reportTotalBadge: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  reportMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reportMetricItem: {
    width: (screenWidth - 80) / 4,
    alignItems: 'center',
  },
  reportMetricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  reportMetricLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  reportTopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  reportTopRank: {
    width: 24,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  reportTopName: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
  },
  reportTopValue: {
    fontSize: 12,
    color: '#888',
  },
  reportLastActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  reportLastActiveText: {
    fontSize: 12,
    color: '#888',
  },
  // Content Moderation Styles
  moderationGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  moderationCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  moderationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  moderationValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  moderationLabel: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    marginBottom: 6,
  },
  moderationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moderationStatusText: {
    fontSize: 10,
    color: '#888',
  },
  moderationActions: {
    marginTop: 16,
    gap: 8,
  },
  moderationActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  moderationActionText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  moderationBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moderationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  moderationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  moderationNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
  // Completions by Mood Widget Styles
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
  },
  expandButtonText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '500',
  },
  moodCompletionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  moodCompletionCard: {
    width: (screenWidth - 64) / 3,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  moodCompletionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodCompletionValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  moodCompletionLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  // Completions by Mood Modal Styles
  moodChartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  moodLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moodLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  moodLegendText: {
    fontSize: 12,
    color: '#888',
  },
  moodChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  moodChartLabel: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moodChartIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodChartLabelText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  moodChartBarsContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  moodChartTotal: {
    width: 40,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  noEngagementSubtext: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
  // Build for Me Analytics Styles
  buildForMeQuickStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  buildForMeStatCard: {
    width: (screenWidth - 54) / 4,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 164, 76, 0.15)',
  },
  buildForMeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  buildForMeStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  buildForMeStatLabel: {
    fontSize: 9,
    color: '#888',
    textAlign: 'center',
  },
  buildForMeMoodBreakdown: {
    marginTop: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 164, 76, 0.1)',
  },
  buildForMeMoodTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 12,
  },
  buildForMeMoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  buildForMeMoodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    gap: 6,
  },
  buildForMeMoodName: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  buildForMeMoodBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  buildForMeMoodBar: {
    height: '100%',
    borderRadius: 3,
  },
  buildForMeMoodCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    width: 35,
    textAlign: 'right',
  },
  // Custom Workouts Added Styles
  customWorkoutsQuickStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  customWorkoutsStatCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.15)',
  },
  customWorkoutsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  customWorkoutsStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  customWorkoutsStatLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
  // Chart Period Selector Styles
  chartPeriodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
    gap: 8,
  },
  chartPeriodLabel: {
    fontSize: 13,
    color: '#888',
    marginRight: 4,
  },
  chartPeriodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
  },
  chartPeriodButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  chartPeriodButtonText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  chartPeriodButtonTextActive: {
    color: '#FFD700',
  },
  // Engagement Chart Styles
  engagementChartContainer: {
    marginTop: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chartLegendText: {
    fontSize: 11,
    color: '#888',
  },
  chartScrollView: {
    maxHeight: 120,
  },
  chartBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingVertical: 8,
  },
  chartBarGroup: {
    alignItems: 'center',
    minWidth: 40,
  },
  chartBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 80,
  },
  chartBar: {
    width: 10,
    borderRadius: 4,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 9,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 40,
  },
  noChartData: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginTop: 8,
  },
  noChartDataText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
});
