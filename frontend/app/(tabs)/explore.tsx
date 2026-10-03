/**
 * Explore (V3, Oct 2026): the V2 Explore "Live" page, brought over as the whole tab. The social feed (For You, posts,
 * search, notifications, create post) is gone; what remains is the header and the Live activity feed (components/LiveFeed).
 *
 * The feed (GET /api/feed/live) now also carries MOOD V3 workouts (labelled Strength / Sweat / Athletic, Try this workout ->
 * Build preset) and, while real activity is low, sample sessions (backend/v3_explore.feed_samples, EXPLORE_SYNTHETIC): in
 * production they show no name or face, carry a SAMPLE tag, and are never counted in the "sessions today" header.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useScreenTime } from '../../hooks/useScreenTime';
import LiveFeed from '../../components/LiveFeed';
import { COLORS } from '../../constants/brand';

// Pulsing gold dot used inside the "Live" tab label (V2)
const LiveTabPulseDot: React.FC = () => {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F5C518', opacity }} />;
};

export default function Explore() {
  useScreenTime('Explore');
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  return (
    <View style={styles.container} testID="explore-live">
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Explore</Text>
      </View>
      <View style={styles.tabContainer}>
        <View style={[styles.feedTab, styles.feedTabActive]}>
          <View style={styles.liveTabInner}>
            <Text style={[styles.feedTabText, styles.feedTabTextActive]}>Live</Text>
            <View style={styles.liveTabDotWrap}>
              <LiveTabPulseDot />
            </View>
          </View>
        </View>
      </View>
      <LiveFeed token={token} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.1)',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 215, 0, 0.1)', paddingHorizontal: 16, alignItems: 'center' },
  feedTab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  feedTabActive: { borderBottomColor: '#F5C518' },
  feedTabText: { fontSize: 15, fontWeight: '600', color: '#6B6B6B' },
  feedTabTextActive: { color: '#FFFFFF' },
  liveTabInner: { flexDirection: 'row', alignItems: 'center' },
  liveTabDotWrap: { marginLeft: 6 },
});
