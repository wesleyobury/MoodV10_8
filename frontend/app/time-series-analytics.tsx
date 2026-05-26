import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { BarChart, LineChart } from 'react-native-chart-kit';
import BackButton from '../components/BackButton';

import { API_URL } from '../utils/apiConfig';
const screenWidth = Dimensions.get('window').width;

interface TimeSeriesData {
  metric_type: string;
  period: string;
  labels: string[];
  values: number[];
  secondary_values: number[];
  total: number;
  average: number;
}

interface BreakdownItem {
  name: string;
  count: number;
}

interface BreakdownData {
  metric_type: string;
  items: BreakdownItem[];
  total: number;
}

const METRIC_INFO: Record<string, { title: string; icon: string; description: string; unit: string; hasBreakdown: boolean }> = {
  active_users: {
    title: 'Active Users',
    icon: 'people',
    description: 'Unique users who performed any action',
    unit: 'users',
    hasBreakdown: false,
  },
  app_sessions: {
    title: 'App Sessions',
    icon: 'phone-portrait',
    description: 'Number of times the app was opened',
    unit: 'sessions',
    hasBreakdown: false,
  },
  screen_views: {
    title: 'Screen Views',
    icon: 'eye',
    description: 'Total screen views across all users',
    unit: 'views',
    hasBreakdown: true,
  },
  screen_time: {
    title: 'Screen Time',
    icon: 'time',
    description: 'Total time spent in the app',
    unit: 'minutes',
    hasBreakdown: false,
  },
  workouts_started: {
    title: 'Workouts Started',
    icon: 'barbell',
    description: 'Number of workouts initiated',
    unit: 'workouts',
    hasBreakdown: false,
  },
  workouts_completed: {
    title: 'Workouts Completed',
    icon: 'checkmark-circle',
    description: 'Number of workouts finished',
    unit: 'workouts',
    hasBreakdown: false,
  },
  mood_selections: {
    title: 'Mood Selections',
    icon: 'happy',
    description: 'Workout mood/goal selections made',
    unit: 'selections',
    hasBreakdown: true,
  },
  posts_created: {
    title: 'Posts Created',
    icon: 'images',
    description: 'New posts shared by users',
    unit: 'posts',
    hasBreakdown: false,
  },
  social_interactions: {
    title: 'Social Interactions',
    icon: 'heart',
    description: 'Likes, comments, and follows combined',
    unit: 'interactions',
    hasBreakdown: true,
  },
  new_users: {
    title: 'New Users',
    icon: 'person-add',
    description: 'New user registrations',
    unit: 'users',
    hasBreakdown: false,
  },
};

export default function TimeSeriesAnalytics() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  
  const metricType = (params.metric as string) || 'active_users';
  const metricInfo = METRIC_INFO[metricType] || METRIC_INFO.active_users;
  
  const [data, setData] = useState<TimeSeriesData | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  const periods = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
  ];

  useEffect(() => {
    fetchData();
  }, [metricType, period]);

  const fetchData = async () => {
    if (!token) return;
    
    try {
      // Fetch time series data
      const response = await fetch(
        `${API_URL}/api/analytics/admin/time-series/${metricType}?period=${period}&limit=30`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
      
      // Fetch breakdown if available
      if (metricInfo.hasBreakdown) {
        const breakdownResponse = await fetch(
          `${API_URL}/api/analytics/admin/breakdown/${metricType}?days=${period === 'month' ? 365 : period === 'week' ? 180 : 30}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (breakdownResponse.ok) {
          const breakdownResult = await breakdownResponse.json();
          setBreakdown(breakdownResult);
        }
      }
    } catch (error) {
      console.error('Error fetching time series:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

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

  const renderChart = () => {
    if (!data || data.values.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="bar-chart-outline" size={48} color='#666' />
          <Text style={styles.noDataText}>No data available for this period</Text>
        </View>
      );
    }

    // Limit to last 10 data points for better visibility
    const displayLabels = data.labels.slice(-10);
    const displayValues = data.values.slice(-10);

    const chartData = {
      labels: displayLabels,
      datasets: [{ data: displayValues.length > 0 ? displayValues : [0] }],
    };

    if (chartType === 'line') {
      return (
        <LineChart
          data={chartData}
          width={screenWidth - 48}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          fromZero
        />
      );
    }

    return (
      <BarChart
        data={chartData}
        width={screenWidth - 48}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={chartConfig}
        style={styles.chart}
        showValuesOnTopOfBars
        fromZero
      />
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{metricInfo.title}</Text>
          <Text style={styles.headerSubtitle}>{metricInfo.description}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons name={metricInfo.icon as any} size={24} color="#FFD700" />
            <Text style={styles.summaryValue}>{data?.total?.toLocaleString() || 0}</Text>
            <Text style={styles.summaryLabel}>Total {metricInfo.unit}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="analytics" size={24} color="#4CAF50" />
            <Text style={styles.summaryValue}>{data?.average?.toLocaleString() || 0}</Text>
            <Text style={styles.summaryLabel}>Avg per {period}</Text>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[
                styles.periodButton,
                period === p.value && styles.periodButtonActive
              ]}
              onPress={() => setPeriod(p.value as 'day' | 'week' | 'month')}
            >
              <Text style={[
                styles.periodText,
                period === p.value && styles.periodTextActive
              ]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart Type Toggle */}
        <View style={styles.chartToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, chartType === 'bar' && styles.toggleButtonActive]}
            onPress={() => setChartType('bar')}
          >
            <Ionicons name='bar-chart' size={18} color={chartType === 'bar' ? '#FFD700' : '#666'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, chartType === 'line' && styles.toggleButtonActive]}
            onPress={() => setChartType('line')}
          >
            <Ionicons name='trending-up' size={18} color={chartType === 'line' ? '#FFD700' : '#666'} />
          </TouchableOpacity>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          {renderChart()}
        </View>

        {/* Breakdown Section */}
        {metricInfo.hasBreakdown && breakdown && breakdown.items.length > 0 && (
          <View style={styles.breakdownSection}>
            <Text style={styles.sectionTitle}>Breakdown</Text>
            {breakdown.items.map((item, index) => (
              <View key={index} style={styles.breakdownItem}>
                <View style={styles.breakdownLeft}>
                  <View style={[styles.breakdownRank, index === 0 && styles.goldRank]}>
                    <Text style={[styles.rankText, index === 0 && styles.goldRankText]}>{index + 1}</Text>
                  </View>
                  <Text style={styles.breakdownName}>{item.name}</Text>
                </View>
                <View style={styles.breakdownRight}>
                  <Text style={styles.breakdownCount}>{item.count.toLocaleString()}</Text>
                  <Text style={styles.breakdownPercent}>
                    {((item.count / breakdown.total) * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Data Table */}
        <View style={styles.dataTableSection}>
          <Text style={styles.sectionTitle}>Data Points</Text>
          <View style={styles.dataTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Period</Text>
              <Text style={styles.tableHeaderText}>{metricInfo.unit}</Text>
            </View>
            {data?.labels.slice().reverse().slice(0, 15).map((label, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{label}</Text>
                <Text style={styles.tableCellValue}>
                  {data.values.slice().reverse()[index]?.toLocaleString() || 0}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backButton: {
    width: 40,
    height: 40,
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
  content: {
    flex: 1,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  periodButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: '#FFD700',
  },
  periodText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  periodTextActive: {
    color: '#FFD700',
  },
  chartToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  toggleButtonActive: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  chartContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  chart: {
    borderRadius: 8,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noDataText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  breakdownSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goldRank: {
    backgroundColor: '#FFD700',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  goldRankText: {
    color: '#000',
  },
  breakdownName: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  breakdownPercent: {
    fontSize: 12,
    color: '#888',
  },
  dataTableSection: {
    marginBottom: 20,
  },
  dataTable: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#252525',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  tableCell: {
    fontSize: 14,
    color: '#fff',
  },
  tableCellValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
});
