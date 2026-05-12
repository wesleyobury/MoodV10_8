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
const ROW_HEIGHT_ESTIMATE = 56; // approx per-row height inside expanded list

export default function InSessionProgressBar({
  exercises,
  currentIndex,
  workoutTitle,
}: InSessionProgressBarProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  // Auto-scroll: pin active to position-2 of 4; clamp at edges.
  useEffect(() => {
    if (!scrollRef.current) return;
    const itemAdvance = ITEM_WIDTH + ITEM_GAP;
    const targetOffset = Math.max(0, (currentIndex - 1) * itemAdvance);
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: targetOffset, animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [currentIndex]);

  // Animate expand/collapse
  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [expanded, expandAnim]);

  // Swipe gesture on the floating chevron.
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
      // Title row (~28) + N rows + bottom padding (~8)
      Math.min(28 + exercises.length * ROW_HEIGHT_ESTIMATE + 8, 360),
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
                    <Ionicons name={iconName} size={14} color="#0c0c0c" />
                  </LinearGradient>
                ) : isCompleted ? (
                  <View style={styles.circleCompleted}>
                    <Ionicons name="checkmark" size={14} color="#0c0c0c" />
                  </View>
                ) : (
                  <View style={styles.circleUpcoming}>
                    <Ionicons
                      name={iconName}
                      size={14}
                      color="rgba(255, 215, 0, 0.7)"
                    />
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

        {/* Floating chevron — absolutely positioned, no extra vertical
            spacing in the bar. */}
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
            color="rgba(255, 215, 0, 0.8)"
          />
        </TouchableOpacity>
      </View>

      {/* Expandable detail panel — lists ALL exercises with one-sentence summary */}
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
                <View style={styles.detailIndex}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={12} color="#0c0c0c" />
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
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  barWrap: {
    position: 'relative',
    paddingTop: 6,
    paddingBottom: 2,
  },
  scrollContent: {
    paddingHorizontal: SCROLL_PADDING,
    paddingRight: SCROLL_PADDING + 22, // small reserve under the floating chevron
    gap: ITEM_GAP,
    alignItems: 'flex-start',
  },
  stepItem: {
    width: ITEM_WIDTH,
    alignItems: 'center',
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
    backgroundColor: 'rgba(255, 215, 0, 0.55)',
    marginBottom: 2,
  },
  circleUpcoming: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    backgroundColor: 'transparent',
    marginBottom: 2,
  },
  stepLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 12,
  },
  stepLabelActive: {
    color: '#FFD700',
    fontWeight: '700',
  },
  stepLabelUpcoming: {
    color: 'rgba(255, 255, 255, 0.55)',
  },
  chevronFloating: {
    position: 'absolute',
    right: 6,
    bottom: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  detailPanel: {
    overflow: 'hidden',
  },
  detailScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  detailHeader: {
    fontSize: 12,
    color: '#FFD700',
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
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  detailRowActive: {
    borderTopColor: 'rgba(255, 215, 0, 0.35)',
  },
  detailIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  detailIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 215, 0, 0.8)',
  },
  detailIndexTextActive: {
    color: '#FFD700',
  },
  detailRowText: {
    flex: 1,
  },
  detailRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  detailRowTitleActive: {
    color: '#FFD700',
  },
  detailRowEquipment: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.55)',
  },
  detailRowSummary: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    marginTop: 2,
  },
});
