/**
 * SessionSafetyBanner — App Store compliance (Part 3 of the 2026-05-14
 * compliance ticket).
 *
 * Renders a single-line, dismissible banner ONE TIME per app launch on the
 * first time the workout-guidance screen mounts. Backed by a module-level
 * flag that resets only when the JS bundle re-evaluates (i.e. cold start).
 *
 *   "Listen to your body. Stop if you feel pain or dizziness."
 *
 * Non-blocking. No modal. No analytics dependency. Dismiss with X.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

let SESSION_SHOWN = false;

export function SessionSafetyBanner() {
  // `visible` is sticky-false once dismissed OR once this app session has
  // already shown the banner on a prior mount.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!SESSION_SHOWN) {
      SESSION_SHOWN = true;
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <View
      style={styles.banner}
      accessibilityRole="alert"
      testID="session-safety-banner"
      // @ts-ignore — RN treats `data-testid` as a string prop in web bundles.
      data-testid="session-safety-banner"
    >
      <Ionicons name="alert-circle-outline" size={16} color="#FFD700" style={styles.icon} />
      <Text numberOfLines={1} style={styles.text}>
        Listen to your body. Stop if you feel pain or dizziness.
      </Text>
      <TouchableOpacity
        onPress={() => setVisible(false)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        testID="session-safety-banner-dismiss"
        // @ts-ignore — RN treats `data-testid` as a string prop in web bundles.
        data-testid="session-safety-banner-dismiss"
      >
        <Ionicons name="close" size={16} color="#9A9A9A" />
      </TouchableOpacity>
    </View>
  );
}

/**
 * Test-only escape hatch. Resets the module-level "already shown" flag so
 * unit tests can verify the once-per-app-session behavior without forcing
 * a bundle reload. NOT exported from any public surface other than tests.
 */
export function __resetSessionSafetyBannerForTesting(): void {
  SESSION_SHOWN = false;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderColor: 'rgba(255,215,0,0.35)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  icon: { marginRight: 8 },
  text: {
    flex: 1,
    color: '#E6E6E6',
    fontSize: 12,
    lineHeight: 16,
  },
});

export default SessionSafetyBanner;
