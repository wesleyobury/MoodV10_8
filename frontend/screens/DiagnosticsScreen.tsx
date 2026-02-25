/**
 * DiagnosticsScreen - In-app backend verification panel
 * 
 * Access: 5 rapid taps on login screen header
 * Purpose: Debug which backend TestFlight is pointing to
 * Safe for production builds - no sensitive data exposed
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { API_URL } from '../utils/apiConfig';

interface HealthCheckResult {
  status: 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
  responseTime?: number;
}

export default function DiagnosticsScreen() {
  const router = useRouter();
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult>({ status: 'loading' });
  const [refreshCount, setRefreshCount] = useState(0);

  // Log active backend on mount
  useEffect(() => {
    console.log('========================================');
    console.log('🔧 DIAGNOSTICS SCREEN MOUNTED');
    console.log('========================================');
    console.log('ACTIVE BACKEND:', API_URL);
    console.log('process.env.EXPO_PUBLIC_BACKEND_URL:', process.env.EXPO_PUBLIC_BACKEND_URL);
    console.log('Constants.expoConfig?.extra:', JSON.stringify(Constants.expoConfig?.extra, null, 2));
    console.log('========================================');
  }, []);

  // Perform health check
  useEffect(() => {
    performHealthCheck();
  }, [refreshCount]);

  const performHealthCheck = async () => {
    setHealthCheck({ status: 'loading' });
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const responseTime = Date.now() - startTime;
      const text = await response.text();
      
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text.substring(0, 500) };
      }
      
      if (response.ok) {
        setHealthCheck({
          status: 'success',
          data,
          responseTime,
        });
      } else {
        setHealthCheck({
          status: 'error',
          error: `HTTP ${response.status}: ${text.substring(0, 200)}`,
          responseTime,
        });
      }
    } catch (error: any) {
      setHealthCheck({
        status: 'error',
        error: error.message || 'Network request failed',
        responseTime: Date.now() - startTime,
      });
    }
  };

  const isPreviewDomain = API_URL?.includes('.preview.emergentagent.com');
  const appVersion = Constants.expoConfig?.version || Constants.manifest?.version || 'Unknown';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || 
                      Constants.expoConfig?.android?.versionCode || 
                      'Unknown';
  const runtimeVersion = Constants.expoConfig?.runtimeVersion || 'Unknown';

  const DiagnosticRow = ({ label, value, isGood, isBad }: { label: string; value: string; isGood?: boolean; isBad?: boolean }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[
        styles.value,
        isGood && styles.valueGood,
        isBad && styles.valueBad,
      ]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.title}>Diagnostics</Text>
        <TouchableOpacity onPress={() => setRefreshCount(c => c + 1)} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Backend Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backend Configuration</Text>
          
          <DiagnosticRow 
            label="API_URL" 
            value={API_URL || '(not set)'} 
          />
          
          <DiagnosticRow 
            label="EXPO_PUBLIC_BACKEND_URL" 
            value={process.env.EXPO_PUBLIC_BACKEND_URL || '(not set)'} 
          />
          
          <DiagnosticRow 
            label="Is Preview Domain" 
            value={isPreviewDomain ? 'YES' : 'NO'} 
            isGood={isPreviewDomain}
            isBad={!isPreviewDomain && !!API_URL}
          />
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Info</Text>
          
          <DiagnosticRow label="Version" value={appVersion} />
          <DiagnosticRow label="Build Number" value={String(buildNumber)} />
          <DiagnosticRow label="Runtime Version" value={String(runtimeVersion)} />
          <DiagnosticRow label="Platform" value={Platform.OS} />
          <DiagnosticRow label="Expo SDK" value={Constants.expoConfig?.sdkVersion || 'Unknown'} />
        </View>

        {/* Health Check */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Check: {API_URL}/api/health</Text>
          
          {healthCheck.status === 'loading' ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFD700" />
              <Text style={styles.loadingText}>Checking backend health...</Text>
            </View>
          ) : healthCheck.status === 'success' ? (
            <>
              <DiagnosticRow 
                label="Status" 
                value="✓ CONNECTED" 
                isGood 
              />
              <DiagnosticRow 
                label="Response Time" 
                value={`${healthCheck.responseTime}ms`} 
              />
              <View style={styles.jsonContainer}>
                <Text style={styles.jsonText}>
                  {JSON.stringify(healthCheck.data, null, 2)}
                </Text>
              </View>
            </>
          ) : (
            <>
              <DiagnosticRow 
                label="Status" 
                value="✗ FAILED" 
                isBad 
              />
              <DiagnosticRow 
                label="Response Time" 
                value={`${healthCheck.responseTime}ms`} 
              />
              <View style={[styles.jsonContainer, styles.errorContainer]}>
                <Text style={styles.errorText}>{healthCheck.error}</Text>
              </View>
            </>
          )}
        </View>

        {/* Expo Config Extra */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Constants.expoConfig.extra</Text>
          <View style={styles.jsonContainer}>
            <Text style={styles.jsonText}>
              {JSON.stringify(Constants.expoConfig?.extra || {}, null, 2)}
            </Text>
          </View>
        </View>

        {/* Debug Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Info</Text>
          <DiagnosticRow 
            label="__DEV__" 
            value={__DEV__ ? 'true' : 'false'} 
          />
          <DiagnosticRow 
            label="App Ownership" 
            value={Constants.appOwnership || 'Unknown'} 
          />
          <DiagnosticRow 
            label="Execution Env" 
            value={Constants.executionEnvironment || 'Unknown'} 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    color: '#888',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 2,
  },
  value: {
    fontSize: 12,
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  valueGood: {
    color: '#4ade80',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  valueBad: {
    color: '#f87171',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    color: '#888',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  jsonContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  jsonText: {
    fontSize: 11,
    color: '#4ade80',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorContainer: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  errorText: {
    fontSize: 11,
    color: '#f87171',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
