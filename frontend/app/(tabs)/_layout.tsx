import { Tabs, usePathname } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientIcon from '../../components/GradientIcon';
import { useAuth } from '../../contexts/AuthContext';
import { useBadges } from '../../contexts/BadgeContext';
import { Analytics } from '../../utils/analytics';

// Re-export useBadges for components that import from _layout
export { useBadges } from '../../contexts/BadgeContext';

export default function TabLayout() {
  const { token } = useAuth();
  const previousTab = useRef<string>('index');
  const { unreadNotifications, unreadMessages, totalBadgeCount, refreshBadges } = useBadges();

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
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#0c0c0c',
          borderTopWidth: 1,
          borderTopColor: '#222',
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
          backgroundColor: '#0c0c0c',
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
      {/* Explore - Left position - Shows notification badge (likes, comments, follows) */}
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
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      {/* Workouts - Center position */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Workouts',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused ? (
                <GradientIcon name="fitness" size={24} />
              ) : (
                <Ionicons name="fitness-outline" size={24} color={color} />
              )}
            </View>
          ),
        }}
      />
      {/* Profile - Right position - Shows DM badge */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused ? (
                <GradientIcon name="person" size={24} />
              ) : (
                <Ionicons name="person-outline" size={24} color={color} />
              )}
              {unreadMessages > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
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
    borderColor: '#0c0c0c',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});