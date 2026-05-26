/**
 * Wearable Data screen — surfaces every metric MOOD currently reads from
 * Apple HealthKit. Lives at `/wearable-data` and is reached from the
 * Settings → Health Data section.
 *
 * Three states:
 *   1. HealthKit unavailable (non-iOS / Expo Go / older devices) → terse
 *      banner explaining the platform constraint.
 *   2. HealthKit available but no snapshot yet → "Connect to start
 *      tracking" empty-state with a single CTA that fires the iOS
 *      permission sheet via HealthContext.requestPermissions().
 *   3. Snapshot present → dashboard grid of the 5 metrics + last-synced
 *      footer + manual Refresh affordance.
 *
 * Read-only — no writes, no entitlement requests beyond what the existing
 * Settings flow already requests. Pure consumer of HealthContext.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHealth } from '../contexts/HealthContext';
import type { BiometricSnapshot } from '../modules/mood-healthkit/src';
import { getHealthKitDiagnostics } from '../modules/mood-healthkit/src';

const GOLD = '#FFD700';

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 45) return 'just now';
  if (seconds < 90) return '1 minute ago';
  if (seconds < 60 * 60) return `${Math.round(seconds / 60)} minutes ago`;
  if (seconds < 60 * 90) return '1 hour ago';
  if (seconds < 60 * 60 * 24) return `${Math.round(seconds / 3600)} hours ago`;
  if (seconds < 60 * 60 * 36) return 'yesterday';
  return `${Math.round(seconds / 86400)} days ago`;
}

type MetricKey = keyof Pick<
  BiometricSnapshot,
  'restingHeartRate' | 'heartRateVariabilitySDNN' | 'asleepDurationMinutes' | 'activeEnergyBurnedKcal' | 'stepCount'
>;

interface MetricDef {
  key: MetricKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  unit: string;
  format: (v: number) => string;
  hint: string;
}

const METRICS: MetricDef[] = [
  {
    key: 'restingHeartRate',
    label: 'Resting Heart Rate',
    icon: 'heart-outline',
    unit: 'bpm',
    format: (v) => Math.round(v).toString(),
    hint: 'Lower = better recovery',
  },
  {
    key: 'heartRateVariabilitySDNN',
    label: 'Heart Rate Variability',
    icon: 'pulse-outline',
    unit: 'ms',
    format: (v) => Math.round(v).toString(),
    hint: 'Higher = more recovered',
  },
  {
    key: 'asleepDurationMinutes',
    label: 'Sleep Last Night',
    icon: 'moon-outline',
    unit: '',
    format: (v) => {
      const h = Math.floor(v / 60);
      const m = Math.round(v % 60);
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    },
    hint: '7–9h is the recovery sweet spot',
  },
  {
    key: 'activeEnergyBurnedKcal',
    label: 'Active Energy',
    icon: 'flame-outline',
    unit: 'kcal',
    format: (v) => Math.round(v).toLocaleString(),
    hint: 'Burned yesterday',
  },
  {
    key: 'stepCount',
    label: 'Steps',
    icon: 'footsteps-outline',
    unit: '',
    format: (v) => Math.round(v).toLocaleString(),
    hint: 'Yesterday',
  },
];

export default function WearableDataScreen() {
  const {
    available,
    status,
    snapshot,
    lastSyncedAt,
    isRefreshing,
    requestPermissions,
    refresh,
  } = useHealth();

  const hasAnyValue = useMemo(() => {
    if (!snapshot) return false;
    return METRICS.some((m) => snapshot[m.key] != null);
  }, [snapshot]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="wearable-data-back"
        >
          <Ionicons name="chevron-back" size={24} color={GOLD} />
        </TouchableOpacity>
        <Text style={styles.title}>Wearable Data</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          available && status === 'determined' ? (
            <RefreshControl
              tintColor={GOLD}
              refreshing={isRefreshing}
              onRefresh={() => refresh({ silent: false })}
            />
          ) : undefined
        }
      >
        {/* State 1 — HealthKit unavailable */}
        {!available && (
          <View style={styles.emptyCard} testID="wearable-data-unavailable">
            <Ionicons name="watch-outline" size={42} color="#555" />
            <Text style={styles.emptyTitle}>Wearables unavailable</Text>
            <Text style={styles.emptyBody}>
              {(() => {
                const diag = getHealthKitDiagnostics();
                if (diag.platformOS !== 'ios') {
                  return 'MOOD reads health metrics from Apple Health on iPhone. Open MOOD on your iPhone to connect a wearable and start tracking.';
                }
                if (!diag.nativeModuleRegistered) {
                  return "Your current build doesn't include the HealthKit native module. Rebuild the dev client (eas build --profile development --platform ios --clear-cache) and reinstall. TestFlight builds include it automatically.";
                }
                if (diag.isHealthDataAvailable === false) {
                  return 'Your iPhone reports HealthKit as unavailable. This is unusual — make sure the Apple Health app is installed and that you signed in to iCloud. Restart your phone and try again.';
                }
                return 'HealthKit is loaded but reported as unavailable. Pull down to refresh or restart the app.';
              })()}
            </Text>
            <View style={styles.diagBox} testID="wearable-data-diagnostics">
              {Object.entries(getHealthKitDiagnostics()).map(([k, v]) => (
                <Text key={k} style={styles.diagLine}>{k}: {String(v)}</Text>
              ))}
            </View>
          </View>
        )}

        {/* State 2 — HealthKit available, no permission yet OR no data */}
        {available && (status !== 'determined' || !hasAnyValue) && (
          <View style={styles.emptyCard} testID="wearable-data-empty">
            <Ionicons name="watch-outline" size={42} color={GOLD} />
            <Text style={styles.emptyTitle}>
              {status === 'determined' ? 'No data yet' : 'Connect to start tracking'}
            </Text>
            <Text style={styles.emptyBody}>
              {status === 'determined'
                ? "We haven't received any metrics from your wearable yet. Open the Health app on your iPhone to confirm your watch is syncing, then pull down to refresh."
                : 'Link MOOD to Apple Health to pull in resting heart rate, HRV, sleep, active energy, and steps from your wearable.'}
            </Text>
            {status !== 'determined' ? (
              <TouchableOpacity
                style={styles.cta}
                onPress={async () => {
                  await requestPermissions();
                }}
                testID="wearable-data-connect-button"
              >
                <Text style={styles.ctaText}>Connect Apple Health</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.cta, styles.ctaSecondary]}
                onPress={() => {
                  Linking.openURL('x-apple-health://').catch(() =>
                    Linking.openURL('app-settings:').catch(() => {}),
                  );
                }}
                testID="wearable-data-open-health-app"
              >
                <Text style={[styles.ctaText, styles.ctaSecondaryText]}>
                  Open Apple Health
                </Text>
              </TouchableOpacity>
            )}
            <View style={styles.diagBox} testID="wearable-data-diagnostics">
              {Object.entries(getHealthKitDiagnostics()).map(([k, v]) => (
                <Text key={k} style={styles.diagLine}>{k}: {String(v)}</Text>
              ))}
            </View>
          </View>
        )}

        {/* State 3 — Snapshot present */}
        {available && status === 'determined' && hasAnyValue && snapshot && (
          <>
            <View style={styles.lastSynced}>
              <Ionicons name="sync-outline" size={14} color="#888" />
              <Text style={styles.lastSyncedText}>
                Last synced {formatRelative(lastSyncedAt)}
              </Text>
            </View>

            <View style={styles.grid} testID="wearable-data-grid">
              {METRICS.map((m) => {
                const raw = snapshot[m.key];
                const hasValue = raw != null;
                return (
                  <View
                    key={m.key}
                    style={styles.card}
                    testID={`wearable-data-card-${m.key}`}
                  >
                    <View style={styles.cardHead}>
                      <Ionicons name={m.icon} size={18} color={GOLD} />
                      <Text style={styles.cardLabel}>{m.label}</Text>
                    </View>
                    <View style={styles.valueRow}>
                      <Text
                        style={[
                          styles.value,
                          !hasValue && styles.valueMuted,
                        ]}
                      >
                        {hasValue ? m.format(raw as number) : '—'}
                      </Text>
                      {hasValue && m.unit ? (
                        <Text style={styles.unit}>{m.unit}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.cardHint}>{m.hint}</Text>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => refresh({ silent: false })}
              disabled={isRefreshing}
              testID="wearable-data-refresh-button"
            >
              {isRefreshing ? (
                <ActivityIndicator color={GOLD} />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={16} color={GOLD} />
                  <Text style={styles.refreshText}>Refresh now</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.privacyFootnote}>
              Read-only access — MOOD never writes, sells, or shares your
              health data.
            </Text>

            <View style={styles.diagBox} testID="wearable-data-diagnostics">
              {Object.entries(getHealthKitDiagnostics()).map(([k, v]) => (
                <Text key={k} style={styles.diagLine}>{k}: {String(v)}</Text>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  headerSpacer: { width: 24 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  emptyCard: {
    backgroundColor: '#0e0e0e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    padding: 22,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 6,
  },
  emptyBody: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  diagBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: '#1a1a1a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  diagLine: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'SpaceMono',
    lineHeight: 16,
  },
  cta: {
    backgroundColor: GOLD,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  ctaSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: GOLD,
  },
  ctaText: { color: '#0c0c0c', fontWeight: '700', fontSize: 14 },
  ctaSecondaryText: { color: GOLD },
  lastSynced: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 12,
    paddingLeft: 2,
  },
  lastSyncedText: { color: '#888', fontSize: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48.5%',
    backgroundColor: '#0e0e0e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    padding: 14,
    marginBottom: 10,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  value: { color: '#fff', fontSize: 26, fontWeight: '700' },
  valueMuted: { color: '#555' },
  unit: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '500' },
  cardHint: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    marginTop: 6,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.28)',
  },
  refreshText: { color: GOLD, fontSize: 13, fontWeight: '600' },
  privacyFootnote: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 16,
  },
});
