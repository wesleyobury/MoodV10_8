/**
 * FoundingBanner — MOOD V2 persistent home banner (Phase 2.2).
 *
 * Shows for founding-eligible users during the window at the bottom of the
 * home screen. Dismiss collapses it to a small chip that stays present.
 */
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/brand';
import { useAuth } from '../contexts/AuthContext';
import { useFoundingPurchase } from '../hooks/useFoundingPurchase';
import { foundingDaysRemaining, FOUNDING_BANNER_COLLAPSED_KEY } from '../utils/founding';
import { Analytics } from '../utils/analytics';

export function FoundingBanner() {
  const { entitlement, token } = useAuth();
  const { claimFounding } = useFoundingPurchase();
  const [collapsed, setCollapsed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const shownRef = useRef(false);

  const eligible =
    !!entitlement?.is_founding_member &&
    !entitlement?.founding_pricing_claimed &&
    !!entitlement?.founding_window_active;

  const daysLeft = foundingDaysRemaining(entitlement?.founding_window_expires_at);

  useEffect(() => {
    AsyncStorage.getItem(FOUNDING_BANNER_COLLAPSED_KEY)
      .then((v) => setCollapsed(v === 'true'))
      .catch(() => setCollapsed(false));
  }, []);

  // Fire founding_banner_shown once when the expanded banner first appears.
  useEffect(() => {
    if (eligible && collapsed === false && !shownRef.current) {
      shownRef.current = true;
      Analytics.foundingBannerShown(token, { days_remaining: daysLeft });
    }
  }, [eligible, collapsed, token, daysLeft]);

  if (!eligible || collapsed === null) return null;

  const handleCollapse = () => {
    Analytics.foundingBannerDismissed(token, { days_remaining: daysLeft });
    setCollapsed(true);
    AsyncStorage.setItem(FOUNDING_BANNER_COLLAPSED_KEY, 'true').catch(() => {});
  };

  const handleClaim = async () => {
    if (busy) return;
    Analytics.foundingBannerClaimTapped(token, { days_remaining: daysLeft });
    setBusy(true);
    await claimFounding('founding_banner');
    setBusy(false);
  };

  const handleExpandChip = () => {
    Analytics.foundingBannerChipTapped(token, { days_remaining: daysLeft });
    setCollapsed(false);
  };

  if (collapsed) {
    return (
      <TouchableOpacity style={styles.chip} onPress={handleExpandChip} testID="founding-chip">
        <Ionicons name="flash" size={12} color={COLORS.accent} />
        <Text style={styles.chipText}>Founding deal · {daysLeft}d</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.banner}>
      <Ionicons name="flash" size={16} color={COLORS.accent} style={{ marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.bannerText}>
          Founding pricing — $39/yr locked. <Text style={styles.bold}>{daysLeft} day{daysLeft === 1 ? '' : 's'} left.</Text>
        </Text>
      </View>
      <TouchableOpacity style={styles.claimBtn} onPress={handleClaim} disabled={busy} testID="founding-banner-claim">
        {busy ? <ActivityIndicator size="small" color={COLORS.accentInk} /> : <Text style={styles.claimText}>Claim</Text>}
      </TouchableOpacity>
      <TouchableOpacity hitSlop={10} onPress={handleCollapse} style={styles.close}>
        <Ionicons name="close" size={16} color={COLORS.textTertiary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  bannerText: { fontSize: 13, color: COLORS.textPrimary },
  bold: { fontWeight: '700', color: COLORS.accent },
  claimBtn: { backgroundColor: COLORS.accent, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14, marginLeft: 8 },
  claimText: { fontSize: 13, fontWeight: '700', color: COLORS.accentInk },
  close: { marginLeft: 8, padding: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  chipText: { fontSize: 12, color: COLORS.accent, fontWeight: '600', marginLeft: 6 },
});

export default FoundingBanner;
