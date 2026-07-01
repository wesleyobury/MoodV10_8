import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSessionSubPathLabel } from '../utils/inSessionProgress';

export interface InSessionExercise {
  workoutName?: string;
  name?: string;
  equipment?: string;
  description?: string;
  workoutType?: string;
}

interface InSessionProgressBarProps {
  exercises: InSessionExercise[];
  currentIndex: number;
  workoutTitle?: string;
  moodCard?: string;
  subPath?: string;
}

// Restrained palette — gold reserved for the current step only.
const C = {
  bg: '#0b0b0d',
  surface: '#141417',
  surfaceActive: '#1c1c21',
  border: 'rgba(255,255,255,0.06)',
  gold: '#FFD700',   // brand gold for the active step / progress
  ink: '#f4f4f5',
  muted: '#9a9aa2',
  dim: '#6a6a72',
  seg: '#26262c',
  done: '#FFD700',
};

export default function InSessionProgressBar({
  exercises,
  currentIndex,
  workoutTitle,
  moodCard,
  subPath,
}: InSessionProgressBarProps) {
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const groupLabels = useMemo(
    () => exercises.map((ex) => getSessionSubPathLabel(ex)),
    [exercises]
  );
  const showDividerBefore = (idx: number): boolean =>
    idx > 0 && !!groupLabels[idx] && groupLabels[idx] !== groupLabels[idx - 1];

  useEffect(() => {
    Animated.timing(anim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [expanded, anim]);

  const total = exercises.length;
  const current = exercises[currentIndex] || {};
  const currentGroup = groupLabels[currentIndex];
  const titleOf = (ex: InSessionExercise, i: number) =>
    ex.workoutName || ex.name || ex.equipment || `Exercise ${i + 1}`;

  const panelHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.min(52 + total * 46 + 20, 360)],
  });
  const chevronRotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.container} testID="in-session-progress-bar">
      {/* header: count + current group + expand toggle */}
      <TouchableOpacity
        style={styles.header}
        activeOpacity={0.7}
        onPress={() => setExpanded((v) => !v)}
        testID="in-session-progress-chevron"
      >
        <Text style={styles.headerText}>
          <Text style={styles.headerStrong}>Exercise {Math.min(currentIndex + 1, total)}</Text>
          <Text style={styles.headerDim}> of {total}</Text>
          {currentGroup ? <Text style={styles.headerGroup}>{'   ·   ' + currentGroup}</Text> : null}
        </Text>
        <View style={styles.allBtn}>
          <Text style={styles.allText}>All</Text>
          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <Ionicons name="chevron-down" size={14} color={C.muted} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* slim segmented track */}
      <View style={styles.track}>
        {exercises.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.segment,
              idx <= currentIndex ? styles.segmentOn : styles.segmentOff,
            ]}
            testID={`in-session-step-${idx}`}
          />
        ))}
      </View>

      {/* expandable, titles-only list */}
      <Animated.View style={[styles.panel, { maxHeight: panelHeight }]} testID="in-session-progress-detail">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
          {(moodCard || subPath || workoutTitle) ? (
            <Text style={styles.panelTitle} numberOfLines={1}>
              {[moodCard, subPath].filter(Boolean).join('  ·  ') || workoutTitle}
            </Text>
          ) : null}
          {exercises.map((ex, idx) => {
            const isActive = idx === currentIndex;
            const isDone = idx < currentIndex;
            const divider = showDividerBefore(idx) ? groupLabels[idx] : null;
            const row = (
              <View
                key={`row-${idx}`}
                style={[styles.row, isActive && styles.rowActive]}
                testID={`in-session-detail-row-${idx}`}
              >
                <View style={[styles.badge, isActive && styles.badgeActive, isDone && styles.badgeDone]}>
                  {isDone ? (
                    <Ionicons name="checkmark" size={13} color={C.done} />
                  ) : (
                    <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>{idx + 1}</Text>
                  )}
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, isActive && styles.rowTitleActive, isDone && styles.rowTitleDone]} numberOfLines={1}>
                    {titleOf(ex, idx)}
                  </Text>
                  {ex.equipment ? <Text style={styles.rowEquip} numberOfLines={1}>{ex.equipment}</Text> : null}
                </View>
              </View>
            );
            if (!divider) return row;
            return (
              <React.Fragment key={`grp-${idx}`}>
                <Text style={styles.sectionLabel}>{divider.toUpperCase()}</Text>
                {row}
              </React.Fragment>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  headerText: { fontSize: 13 },
  headerStrong: { color: C.ink, fontWeight: '600' },
  headerDim: { color: C.dim },
  headerGroup: { color: C.muted },
  allBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  allText: { color: C.muted, fontSize: 12 },
  track: { flexDirection: 'row', gap: 5 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  segmentOn: { backgroundColor: C.gold },
  segmentOff: { backgroundColor: C.seg },
  panel: { overflow: 'hidden' },
  panelContent: { paddingTop: 12 },
  panelTitle: {
    fontSize: 11,
    color: C.dim,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 10,
    color: C.dim,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginTop: 12,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  rowActive: { backgroundColor: C.surfaceActive },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.seg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: { backgroundColor: C.gold },
  badgeDone: { backgroundColor: C.seg },
  badgeText: { fontSize: 11, fontWeight: '600', color: C.muted },
  badgeTextActive: { color: '#0b0b0d' },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, color: C.muted },
  rowTitleActive: { color: C.ink, fontWeight: '500' },
  rowTitleDone: { color: C.dim },
  rowEquip: { fontSize: 11, color: C.dim, marginTop: 1 },
});
