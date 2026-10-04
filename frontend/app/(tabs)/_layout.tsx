import { Tabs, usePathname } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientIcon from '../../components/GradientIcon';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { useBadges } from '../../contexts/BadgeContext';
import { useFounderMessage } from '../../utils/founderMessage';
import { Analytics } from '../../utils/analytics';

// Re-export useBadges for components that import from _layout
export { useBadges } from '../../contexts/BadgeContext';

export default function TabLayout() {
  const { token, user, isGuest } = useAuth();
  // the one badge left: a founder welcome message this user has not opened yet (cleared when they open it on Profile)
  const founder = useFounderMessage(isGuest ? null : user?.id);
  const previousTab = useRef<string>('index');
  // V3 (Oct 2026): the social feed and DMs are gone, so the tabs carry no notification / message badges.
  const { refreshBadges } = useBadges();

  const trackTabSwitch = (toTab: string) => {
    if (token && previousTab.current !== toTab) {
      Analytics.tabSwitched(token, {
        from_tab: previousTab.current,
        to_tab: toTab,
      });
      Analytics.screenViewed(token, {
        screen_name: toTab,
        previous_screen: previousTab.current,
      });
      previousTab.current = toTab;
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: 'rgba(255,250,242,0.5)',
        tabBarStyle: {
          backgroundColor: COLORS.sheet,
          borderTopWidth: 1,
          borderTopColor: COLORS.divider,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 20,
          paddingTop: 10,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        sceneStyle: {
          backgroundColor: COLORS.bg,
        },
      }}
      screenListeners={{
        tabPress: (e) => {
          const tabName = e.target?.split('-')[0] || '';
          trackTabSwitch(tabName);
          refreshBadges();
        },
      }}
    >
      {/* Explore - Left position - Live on MOOD, Trending, MOOD's Picks */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused ? (
                <GradientIcon name="compass" size={24} />
              ) : (
                <Ionicons name="compass-outline" size={24} color={color} />
              )}
            </View>
          ),
        }}
      />
      {/* Home - Center position (H1: was "Workouts"; the route stays `index` so analytics tab names are unchanged) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          // the centre of the bar (founder pass, Oct 2026): a raised gold coin that sits up out of the bar, dark-ink glyph
          // (never gold-on-gold), ringed in the bar colour so it reads as cut out of it. Gold here is the brand CTA fill,
          // the same as the app's primary buttons.
          tabBarLabelStyle: { fontSize: 11, fontWeight: '800', marginTop: 2 },
          tabBarIconStyle: { overflow: 'visible' },
          tabBarIcon: ({ focused }) => (
            <View style={styles.homeLift} pointerEvents="none">
              <View style={[styles.homeRing, focused && styles.homeRingOn]}>
                <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={[styles.homeCoin, focused ? null : { opacity: 0.85 }] as any}>
                  <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={COLORS.accentInk} />
                </LinearGradient>
              </View>
            </View>
          ),
        }}
      />
      {/* Profile - Right position - training identity, history and progress */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarBadge: founder.unseen ? 1 : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.accent, color: COLORS.accentInk, fontSize: 10, fontWeight: '800' },
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused ? (
                <GradientIcon name="person" size={24} />
              ) : (
                <Ionicons name="person-outline" size={24} color={color} />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  homeLift: {
    // lifts the coin so its top half sits above the bar
    marginTop: -25,
    // takes the same 24 pt of layout as the other icons, so the three labels sit on one line
    marginBottom: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeRing: {
    width: 57,
    height: 57,
    borderRadius: 28.5,
    padding: 4.5,
    backgroundColor: COLORS.sheet,
    borderWidth: 1,
    borderColor: COLORS.divider,
    ...(Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: -2 } },
      android: { elevation: 8 },
      default: {},
    }) as object),
  },
  homeRingOn: {
    ...(Platform.select({
      ios: { shadowColor: '#FFB300', shadowOpacity: 0.25, shadowRadius: 11, shadowOffset: { width: 0, height: 0 } },
      default: {},
    }) as object),
  },
  homeCoin: {
    flex: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.sheet,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});