import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import {
  getEquipmentIcon,
  getFirstSentence,
} from '../utils/inSessionProgress';

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
}

const ITEM_WIDTH = 76;
const ITEM_GAP = 12;
const SCROLL_PADDING = 16;
const ROW_HEIGHT_ESTIMATE = 56;

// Palette: light/mid grays with gold reserved for the active icon and accents.
const C = {
  barBg: '#111111',            // matches timer row background
  rowBg: '#1a1a1a',            // slightly lighter expanded surface
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderActive: 'rgba(255, 215, 0, 0.45)',
  labelDefault: 'rgba(235, 235, 240, 0.85)',
  labelMuted: 'rgba(235, 235, 240, 0.55)',
  iconUpcomingBg: 'rgba(255, 255, 255, 0.08)',
  iconUpcomingBorder: 'rgba(255, 255, 255, 0.22)',
  iconCompletedBg: 'rgba(255, 255, 255, 0.18)',
  gold: '#FFD700',
  goldDim: 'rgba(255, 215, 0, 0.85)',
};

export default function InSessionProgressBar({
  exercises,
  currentIndex,
  workoutTitle,
}: InSessionProgressBarProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!scrollRef.current) return;
    const itemAdvance = ITEM_WIDTH + ITEM_GAP;
    const targetOffset = Math.max(0, (currentIndex - 1) * itemAdvance);
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: targetOffset, animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [currentIndex]);

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [expanded, expandAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 12) setExpanded(true);
        else if (g.dy < -12) setExpanded(false);
      },
    })
  ).current;

  const expandedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      0,
      Math.min(40 + exercises.length * ROW_HEIGHT_ESTIMATE + 16, 380),
    ],
  });

  return (
    <View style={styles.container} testID="in-session-progress-bar">
      <View style={styles.barWrap}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          testID="in-session-progress-scroll"
        >
          {exercises.map((ex, idx) => {
            const isActive = idx === currentIndex;
            const isCompleted = idx < currentIndex;
            const isUpcoming = idx > currentIndex;
            const iconName = getEquipmentIcon(ex.equipment);
            const label =
              ex.equipment || ex.workoutName || ex.name || `Step ${idx + 1}`;

            return (
              <View
                key={`${label}-${idx}`}
                style={styles.stepItem}
                testID={`in-session-step-${idx}`}
              >
                {isActive ? (
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.circleActive}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={iconName} size={14} color="#1a1a1a" />
                  </LinearGradient>
                ) : isCompleted ? (
                  <View style={styles.circleCompleted}>
                    <Ionicons name="checkmark" size={14} color={C.gold} />
                  </View>
                ) : (
                  <View style={styles.circleUpcoming}>
                    <Ionicons name={iconName} size={14} color={C.goldDim} />
                  </View>
                )}
                <Text
                  style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                    isUpcoming && styles.stepLabelUpcoming,
                  ]}
                  numberOfLines={2}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Floating chevron — overlays the bar, no extra vertical spacing. */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setExpanded((v) => !v)}
          style={styles.chevronFloating}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          testID="in-session-progress-chevron"
          {...panResponder.panHandlers}
        >
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={C.gold}
          />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[styles.detailPanel, { maxHeight: expandedHeight }]}
        testID="in-session-progress-detail"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailScrollContent}
        >
          {workoutTitle ? (
            <Text style={styles.detailHeader} numberOfLines={1}>
              {workoutTitle}
            </Text>
          ) : null}
          {exercises.map((ex, idx) => {
            const isActive = idx === currentIndex;
            const isCompleted = idx < currentIndex;
            const summary = getFirstSentence(ex.description);
            const titleLine =
              ex.workoutName || ex.name || ex.equipment || `Exercise ${idx + 1}`;
            const equipmentLine = ex.equipment;

            return (
              <View
                key={`detail-${titleLine}-${idx}`}
                style={[
                  styles.detailRow,
                  isActive && styles.detailRowActive,
                ]}
                testID={`in-session-detail-row-${idx}`}
              >
                <View
                  style={[
                    styles.detailIndex,
                    isActive && styles.detailIndexActive,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={12} color={C.gold} />
                  ) : (
                    <Text
                      style={[
                        styles.detailIndexText,
                        isActive && styles.detailIndexTextActive,
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  )}
                </View>
                <View style={styles.detailRowText}>
                  <Text
                    style={[
                      styles.detailRowTitle,
                      isActive && styles.detailRowTitleActive,
                    ]}
                    numberOfLines={1}
                  >
                    {titleLine}
                    {equipmentLine && equipmentLine !== titleLine ? (
                      <Text style={styles.detailRowEquipment}>
                        {'  ·  ' + equipmentLine}
                      </Text>
                    ) : null}
                  </Text>
                  {summary ? (
                    <Text style={styles.detailRowSummary} numberOfLines={2}>
                      {summary}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.barBg,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSubtle,
  },
  barWrap: {
    position: 'relative',
    paddingTop: 6,
    paddingBottom: 2,
  },
  scrollContent: {
    paddingHorizontal: SCROLL_PADDING,
    gap: ITEM_GAP,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  stepItem: {
    width: ITEM_WIDTH,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  circleCompleted: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.iconCompletedBg,
    marginBottom: 2,
  },
  circleUpcoming: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.iconUpcomingBorder,
    backgroundColor: C.iconUpcomingBg,
    marginBottom: 2,
  },
  stepLabel: {
    fontSize: 10,
    color: C.labelDefault,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 12,
  },
  stepLabelActive: {
    color: C.gold,
    fontWeight: '700',
  },
  stepLabelUpcoming: {
    color: C.labelMuted,
  },
  chevronFloating: {
    position: 'absolute',
    right: 6,
    top: 0,
    bottom: 0,
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPanel: {
    overflow: 'hidden',
    backgroundColor: C.rowBg,
  },
  detailScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  detailHeader: {
    fontSize: 12,
    color: C.gold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: C.borderSubtle,
  },
  detailRowActive: {
    borderTopColor: C.borderActive,
  },
  detailIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  detailIndexActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
  },
  detailIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.labelMuted,
  },
  detailIndexTextActive: {
    color: C.gold,
  },
  detailRowText: {
    flex: 1,
  },
  detailRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.labelDefault,
  },
  detailRowTitleActive: {
    color: C.gold,
  },
  detailRowEquipment: {
    fontSize: 12,
    fontWeight: '500',
    color: C.labelMuted,
  },
  detailRowSummary: {
    fontSize: 12,
    color: 'rgba(235, 235, 240, 0.7)',
    lineHeight: 16,
    marginTop: 2,
  },
});
