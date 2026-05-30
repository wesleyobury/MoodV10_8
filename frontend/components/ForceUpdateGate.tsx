/**
 * MOOD V2 — ForceUpdateGate (Phase 1.2).
 *
 * Outermost gate. On launch it reads `/api/config` and compares the running
 * build number against the server-controlled minimum. Below the minimum →
 * a non-dismissible "Update Required" screen. Below `latest` (but >= min) →
 * a dismissible "update available" banner. Fails OPEN (network/server error
 * lets the user in; the backend still enforces entitlement on action).
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Linking,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRunningBuildNumber } from '../utils/version';
import { apiFetch } from '../utils/api';

type UpdateState = 'checking' | 'ok' | 'soft_prompt' | 'blocked';

interface AppConfig {
  min_supported_build_ios: number;
  min_supported_build_android: number;
  latest_build_ios: number;
  latest_build_android: number;
  force_update_message: string;
  ios_store_url: string;
  android_store_url: string;
  update_check_enabled: boolean;
}

export function ForceUpdateGate({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<UpdateState>('checking');
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const checkVersion = useCallback(async () => {
    try {
      const res = await apiFetch<AppConfig>('/api/config');
      if (!res.ok || !res.data) {
        setState('ok'); // fail open
        return;
      }
      const data = res.data;
      if (!data.update_check_enabled) {
        setState('ok');
        return;
      }

      const running = getRunningBuildNumber();
      const min =
        Platform.OS === 'ios' ? data.min_supported_build_ios : data.min_supported_build_android;
      const latest =
        Platform.OS === 'ios' ? data.latest_build_ios : data.latest_build_android;

      setConfig(data);

      if (running < (min ?? 0)) {
        setState('blocked');
      } else if (running < (latest ?? 0)) {
        setState('soft_prompt');
      } else {
        setState('ok');
      }
    } catch {
      setState('ok'); // fail open
    }
  }, []);

  useEffect(() => {
    checkVersion();
  }, [checkVersion]);

  const openStore = useCallback(() => {
    if (!config) return;
    const url = Platform.OS === 'ios' ? config.ios_store_url : config.android_store_url;
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  }, [config]);

  // While checking, render the app (don't block startup on a network call).
  // The blocking modal overlays once we know the user is on a retired build.
  if (state === 'blocked') {
    return (
      <Modal visible transparent={false} animationType="fade" statusBarTranslucent>
        <View style={styles.blockedContainer}>
          <View style={styles.brandWrap}>
            <Text style={styles.brand}>MOOD</Text>
            <Text style={styles.brandSub}>FITNESS</Text>
          </View>
          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.message}>
            {config?.force_update_message ||
              'A new version of MOOD is required to keep training.'}
          </Text>
          <Pressable
            onPress={openStore}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Update Now</Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  return (
    <>
      {children}
      {state === 'soft_prompt' && !bannerDismissed && (
        <View style={[styles.banner, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.bannerBody} onPress={openStore}>
            <Text style={styles.bannerText}>A new version of MOOD is available — tap to update</Text>
          </Pressable>
          <Pressable
            hitSlop={10}
            onPress={() => setBannerDismissed(true)}
            style={styles.bannerClose}
          >
            <Text style={styles.bannerCloseText}>✕</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

const GOLD = '#E8B84B';

const styles = StyleSheet.create({
  blockedContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brand: {
    fontSize: 34,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 8,
  },
  brandSub: {
    fontSize: 11,
    color: '#666',
    letterSpacing: 6,
    marginTop: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: GOLD,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 999,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1f1f1f',
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  bannerBody: {
    flex: 1,
  },
  bannerText: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
  },
  bannerClose: {
    marginLeft: 12,
    padding: 4,
  },
  bannerCloseText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ForceUpdateGate;
